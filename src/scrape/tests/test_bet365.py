"""Recorded first-party MO NBA pipe response, trimmed to two complete games."""
import io
from contextlib import redirect_stdout
from datetime import datetime
from pathlib import Path
import sys
import unittest
import tempfile
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlsplit

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main
from books.bet365.bet365 import parse_markets, fractional_to_american, fetch_sport, NBA_PAGE
from http_client import FeedClient, FeedError
from inspect_bet365_capture import cli as inspect_cli

SAMPLE = (Path(__file__).parent / "fixtures/bet365-nba.txt").read_text(encoding="utf-8").strip()


def offers(text=SAMPLE):
    return parse_markets(text)["IND Pacers vs PHI 76ers"][datetime(2026, 11, 15, 18)]["offers"]


class Bet365Tests(unittest.TestCase):
    def setUp(self):
        clock = patch("books.bet365.bet365.utc_now", return_value=datetime(2026, 11, 15, 12))
        clock.start()
        self.addCleanup(clock.stop)

    def test_saved_capture_cli_writes_normalized_odds_and_prints_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "capture.txt"
            target = Path(directory) / "normalized.json"
            source.write_text(SAMPLE, encoding="utf-8")
            output = io.StringIO()
            with patch.object(sys, "argv", ["inspect", "--file", str(source), "--output", str(target)]), redirect_stdout(output):
                self.assertEqual(inspect_cli(), 0)
            import json
            report = json.loads(output.getvalue())
            self.assertEqual(report["state"], "ok")
            self.assertEqual(report["normalizedMarkets"], 6)
            self.assertNotIn("rows", report)
            self.assertEqual(len(json.loads(target.read_text())), 6)

    def test_invalid_saved_capture_preserves_existing_output(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "capture.txt"
            target = Path(directory) / "normalized.json"
            source.write_text("<html>challenge</html>", encoding="utf-8")
            target.write_text("previous-output", encoding="utf-8")
            with patch.object(sys, "argv", ["inspect", "--file", str(source), "--output", str(target)]), redirect_stdout(io.StringIO()):
                self.assertEqual(inspect_cli(), 1)
            self.assertEqual(target.read_text(), "previous-output")

    def test_capture_joins_original_event_id_and_keeps_price_orientation(self):
        parsed = parse_markets(SAMPLE)
        self.assertEqual(len(parsed), 2)
        self.assertEqual(sum(len(item["offers"]) for starts in parsed.values() for item in starts.values()), 6)
        markets = offers()
        self.assertEqual(markets["Moneyline"], [
            {"name": "IND Pacers", "odds": 235}, {"name": "PHI 76ers", "odds": -290}])
        self.assertEqual(markets["Spread: PHI 76ers: -7.5"], [
            {"name": "IND Pacers +7.5", "odds": -110}, {"name": "PHI 76ers -7.5", "odds": -110}])
        self.assertEqual(markets["Total: 224.5"], [
            {"name": "Over", "odds": -110}, {"name": "Under", "odds": -110}])

    def test_fractional_conversion_and_invalid_prices(self):
        for fractional, expected in [("10/11", -110), ("47/20", 235), ("10/29", -290),
                                     ("1/17", -1700), ("19/2", 950), ("1/1", 100), ("EVS", 100)]:
            self.assertEqual(fractional_to_american(fractional), expected)
        for value in [None, "", "SP", "1/0", "0/1", "-1/2", "NaN"]:
            with self.assertRaises((ValueError, ZeroDivisionError)):
                fractional_to_american(value)

    def test_suspended_or_missing_prices_do_not_form_a_hedge(self):
        self.assertNotIn("Moneyline", offers(SAMPLE.replace("OD=47/20;FS=0;OS=1", "OD=47/20;FS=0;OS=0")))
        self.assertNotIn("Moneyline", offers(SAMPLE.replace("OD=47/20;", "")))
        self.assertNotIn("Moneyline", offers(SAMPLE.replace("OD=47/20;FS=0", "OD=47/20;FS=1")))
        self.assertNotIn("Moneyline", offers(SAMPLE.replace("OD=47/20;", "OD=47/20;SU=1;")))

    def test_real_capture_with_omitted_os_fields_retains_available_upcoming_markets(self):
        text = (Path(__file__).parent / "fixtures/bet365-nba-optional-status.txt").read_text(encoding="utf-8")
        self.assertNotIn("OS=", text)
        warnings = Mock()
        events = parse_markets(text, client=warnings, now=datetime(2026, 11, 15, 18, 30))
        self.assertEqual(len(events), 8)
        self.assertEqual(sum(len(item["offers"]) for starts in events.values() for item in starts.values()), 24)
        self.assertNotIn("IND Pacers vs PHI 76ers", events)
        markets = next(iter(events["LA Lakers vs PHO Suns"].values()))["offers"]
        self.assertEqual(markets["Moneyline"], [{"name": "LA Lakers", "odds": -158}, {"name": "PHO Suns", "odds": 133}])
        self.assertEqual(markets["Spread: LA Lakers: -2.5"], [{"name": "LA Lakers -2.5", "odds": -114}, {"name": "PHO Suns +2.5", "odds": -106}])
        warnings.warn.assert_not_called()

    def test_capture_cutoff_excludes_games_at_or_after_start_without_affecting_replays(self):
        self.assertEqual(len(parse_markets(SAMPLE)), 2)
        self.assertEqual(len(parse_markets(SAMPLE, now=datetime(2026, 11, 15, 17, 59))), 2)
        events = parse_markets(SAMPLE, now=datetime(2026, 11, 15, 18))
        self.assertNotIn("IND Pacers vs PHI 76ers", events)
        self.assertEqual(len(events), 1)
        self.assertEqual(parse_markets(SAMPLE, now=datetime(2026, 11, 15, 22)), {})

    def test_event_flags_and_times_are_required(self):
        for before, after in [("MP=0;FD=IND", "MP=1;FD=IND"), ("FS=0;MP=0;FD=IND", "FS=1;MP=0;FD=IND"),
                              ("BC=20261115180000", "BC=not-a-date")]:
            self.assertNotIn("IND Pacers vs PHI 76ers", parse_markets(SAMPLE.replace(before, after)))

    def test_mismatched_and_duplicate_market_sides_are_rejected(self):
        for before, after in [("HD=-7.5;HA=-7.5", "HD=-6.5;HA=-6.5"),
                              ("HD=U 224.5;HA=224.5", "HD=U 225.5;HA=225.5"),
                              ("HD=U 224.5", "HD=O 224.5")]:
            self.assertEqual(len(offers(SAMPLE.replace(before, after))), 2)
        swapped = SAMPLE.replace("ID=457402658;", "ID=457402660;").replace("ID=457402660;FI=204594883;HD=-", "ID=457402658;FI=204594883;HD=-")
        self.assertNotIn("Spread: PHI 76ers: -7.5", offers(swapped))

    def test_html_navigation_and_wrong_league_are_not_empty_schedules(self):
        for text in ["<html>blocked</html>", "", "{}", SAMPLE.replace("L3=NBA", "L3=Other"), "F|CL;ID=18;|EV;L3=NBA;|"]:
            with self.assertRaises(FeedError) as error:
                parse_markets(text)
            self.assertEqual(error.exception.state, "schema_changed")
        self.assertEqual(parse_markets("F|CL;ID=18;|EV;L3=NBA;|MG;ID=1453;SY=cmx;|MA;ID=M0;|"), {})

    def test_exact_route_encodes_hashes_and_is_scoped_to_captured_region_and_sport(self):
        client = FeedClient("mo")
        try:
            with patch.object(client, "get_text", return_value=SAMPLE) as get:
                fetch_sport("nba", client)
            prepared = requests.Request("GET", get.call_args.args[0], params=get.call_args.kwargs["params"]).prepare()
            parts = urlsplit(prepared.url)
            self.assertEqual(parts.fragment, "")
            self.assertEqual(parse_qs(parts.query)["pd"], [NBA_PAGE])
            self.assertIn("%23AC%23B18", prepared.url)
            for sport, region in [("nhl", "mo"), ("nba", "nj")]:
                client.region = region
                client.bet365_region = region
                with self.assertRaises(FeedError) as error:
                    fetch_sport(sport, client)
                self.assertEqual(error.exception.state, "unsupported")
        finally:
            client.close()

    def test_text_transport_reports_denial_and_rejects_html_success(self):
        client = FeedClient("mo")
        try:
            with patch.object(client.session, "get") as get, redirect_stdout(io.StringIO()):
                get.return_value = Mock(status_code=403)
                with self.assertRaises(FeedError) as error:
                    client.get_text("https://www.mo.bet365.com/feed")
                self.assertEqual(error.exception.state, "blocked")
                get.return_value = Mock(status_code=200, ok=True, headers={"Content-Type": "text/html"})
                with self.assertRaises(FeedError) as error:
                    client.get_text("https://www.mo.bet365.com/feed")
                self.assertEqual(error.exception.state, "unexpected_response")
                get.return_value = Mock(status_code=200, ok=True, headers={"Content-Type": "text/plain"}, text=SAMPLE)
                self.assertEqual(client.get_text("https://www.mo.bet365.com/feed"), SAMPLE)
                self.assertEqual(get.call_args.kwargs["timeout"], (5, 20))
        finally:
            client.close()

    def test_experimental_feed_can_be_checked_without_enabling_scheduled_collection(self):
        self.assertNotIn("bet365", main.FETCHERS)
        self.assertIn("bet365", main.EXPERIMENTAL_FETCHERS)
        with patch.object(FeedClient, "get_text", return_value=SAMPLE), redirect_stdout(io.StringIO()):
            rows, report = main.collect(books=["bet365"], sports=["nba"], region="mo")
        self.assertEqual(report["state"], "ok")
        self.assertEqual(len(rows), 6)
        self.assertEqual(set(report["books"]), {"bet365"})
