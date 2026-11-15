"""Regression tests for recorded feeds, matching, and failure isolation."""
import importlib
import copy
import io
from contextlib import redirect_stdout
import json
import os
import pathlib
import sys
import tempfile
import types
import unittest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import main
from books.betmgm.betmgm import parse_fixtures
from books.caesars.caesars import fetch_sport as fetch_caesars, parse_event
from books.draftkings.draftkings import fetch_sport as fetch_draftkings, parse_league
from books.fanduel.fanduel import parse_attachments
from http_client import FeedClient, FeedError
from markets import add_market, event_info, parse_start

FIXTURES = pathlib.Path(__file__).parent / "fixtures"


def fixture(name):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def offers(events):
    return [market for starts in events.values() for item in starts.values() for market in item["offers"]]


def sample_events(start=datetime(2026, 11, 14, 1, 0)):
    data = {}
    add_market(data, "nba", "BOS Celtics vs NY Knicks", start, "moneyline", [
        {"name": "Boston Celtics", "odds": -110}, {"name": "New York Knicks", "odds": 100},
    ])
    return data


class RecordedFeedTests(unittest.TestCase):
    def test_betmgm_new_option_markets_and_team_totals(self):
        markets = offers(parse_fixtures(fixture("betmgm-nba.json"), "nba"))
        self.assertEqual(len(markets), 5)
        self.assertIn("Total: 219.5", markets)
        self.assertIn("Spread: HOU Rockets: -17.5", markets)
        self.assertIn("Team Total: UTA Jazz: 99.5", markets)
        self.assertNotIn("Total: 150.0", markets)  # Regulation-only market.

    def test_betmgm_hockey_including_ot_and_shootouts(self):
        markets = offers(parse_fixtures(fixture("betmgm-nhl.json"), "nhl"))
        self.assertEqual(len(markets), 3)
        self.assertIn("Total: 6.0", markets)

    def test_betmgm_excludes_live_games(self):
        data = fixture("betmgm-nhl.json")
        data["fixtures"][0]["stage"] = "Live"
        self.assertEqual(parse_fixtures(data, "nhl"), {})

    def test_fanduel_nhl_renamed_competition_and_main_markets(self):
        markets = offers(parse_attachments(fixture("fanduel-nhl.json"), "nhl"))
        self.assertEqual(len(markets), 3)
        self.assertIn("Moneyline", markets)
        self.assertTrue(any(m.startswith("Total:") for m in markets))
        self.assertTrue(any(m.startswith("Spread:") for m in markets))

    def test_fanduel_uses_handicap_not_number_in_runner_label(self):
        self.assertEqual(len(offers(parse_attachments(fixture("fanduel-nba.json"), "nba"))), 3)

    def test_fanduel_never_exports_half_a_suspended_market(self):
        data = fixture("fanduel-nba.json")
        market = next(m for m in data["attachments"]["markets"].values() if m["marketName"] == "Moneyline")
        market["runners"][0]["runnerStatus"] = "SUSPENDED"
        self.assertNotIn("Moneyline", offers(parse_attachments(data, "nba")))

    def test_draftkings_browser_capture_has_nine_games_and_27_markets(self):
        data = fixture("draftkings-control-nba.json")
        client = Mock(region="mo")
        client.get_json.return_value = data
        parsed = fetch_draftkings("nba", client)
        self.assertEqual(main.counts(parsed), {"events": 9, "markets": 27})
        client.warn.assert_not_called()
        start = datetime(2026, 11, 14, 0, 10)
        markets = parsed["IND Pacers vs NY Knicks"][start]["offers"]
        self.assertEqual(markets["Moneyline"], [
            {"name": "IND Pacers", "odds": 220}, {"name": "NY Knicks", "odds": -269},
        ])
        self.assertEqual(markets["Spread: NY Knicks: -6.5"], [
            {"name": "IND Pacers +6.5", "odds": -108}, {"name": "NY Knicks -6.5", "odds": -112},
        ])
        self.assertEqual(markets["Total: 219.5"], [
            {"name": "Over", "odds": -110}, {"name": "Under", "odds": -110},
        ])

    def test_draftkings_browser_capture_combines_with_recorded_betmgm(self):
        dk = parse_league(fixture("draftkings-control-nba.json"), "nba")
        mgm = parse_fixtures(fixture("betmgm-nba.json"), "nba")
        rows = main.aggregate({"draftkings": {"nba": dk}, "betmgm": {"nba": mgm}})
        total = next(row for row in rows if row["event"] == "HOU Rockets vs UTA Jazz"
                     and row["market"] == "Total" and row["outcomes"][0]["name"] == "Over 219.5")
        self.assertEqual(total["outcomes"][0]["books"], {-107: ["draftkings"], -110: ["betmgm"]})
        self.assertEqual(total["outcomes"][1]["books"], {-113: ["draftkings"], -110: ["betmgm"]})

    def test_draftkings_live_unknown_status_and_suspended_side_are_excluded(self):
        original = fixture("draftkings-control-nba.json")
        for status in ("STARTED", "IN_PROGRESS", "SUSPENDED", "FINISHED", "UNKNOWN"):
            data = copy.deepcopy(original)
            data["events"][0]["status"] = status
            parsed = parse_league(data, "nba")
            self.assertNotIn("IND Pacers vs NY Knicks", parsed)
        data = copy.deepcopy(original)
        data["selections"][0]["isSuspended"] = True
        parsed = parse_league(data, "nba")
        markets = parsed["IND Pacers vs NY Knicks"][datetime(2026, 11, 14, 0, 10)]["offers"]
        self.assertNotIn("Moneyline", markets)
        self.assertEqual(len(markets), 2)

    def test_draftkings_bad_start_is_reported_instead_of_silently_lost(self):
        data = fixture("draftkings-control-nba.json")
        data["events"][0]["startEventDate"] = "invalid"
        client = Mock()
        parsed = parse_league(data, "nba", client)
        self.assertEqual(main.counts(parsed), {"events": 8, "markets": 24})
        client.warn.assert_called_once()

    def test_draftkings_offseason_futures_are_not_a_feed_failure(self):
        data = {
            "events": [{"id": "future", "name": "World Series 2027", "eventParticipantType": "MultiTeam",
                        "status": "NOT_STARTED", "leagueId": "84240", "startEventDate": "2027-10-31T00:00:00.0000000Z"}],
            "markets": [], "selections": [],
        }
        client = Mock()
        self.assertEqual(parse_league(data, "mlb", client), {})
        client.warn.assert_not_called()

    def test_caesars_live_nba_prices_and_home_spread_direction(self):
        data = fixture("caesars-nba.json")
        parsed = parse_event(data, "nba")
        self.assertEqual(main.counts(parsed), {"events": 1, "markets": 3})
        markets = parsed["MIL Bucks vs ORL Magic"][datetime(2026, 11, 14, 0)]["offers"]
        self.assertEqual(markets["Moneyline"], [
            {"name": "MIL Bucks", "odds": 310}, {"name": "ORL Magic", "odds": -400},
        ])
        self.assertEqual(markets["Spread: ORL Magic: -9.0"], [
            {"name": "MIL Bucks +9.0", "odds": -110}, {"name": "ORL Magic -9.0", "odds": -110},
        ])

    def test_caesars_live_nhl_deduplicates_sliders_and_excludes_period_bets(self):
        parsed = parse_event(fixture("caesars-nhl.json"), "nhl")
        self.assertEqual(main.counts(parsed), {"events": 1, "markets": 3})
        markets = parsed["NY Rangers vs VAN Canucks"][datetime(2026, 11, 14, 2)]["offers"]
        self.assertEqual(markets["Spread: NY Rangers: -1.5"], [
            {"name": "NY Rangers -1.5", "odds": 113}, {"name": "VAN Canucks +1.5", "odds": -132},
        ])
        self.assertEqual(markets["Total: 6.5"], [
            {"name": "Over", "odds": -105}, {"name": "Under", "odds": -118},
        ])

    def test_caesars_suspended_selection_does_not_export_half_market(self):
        data = fixture("caesars-nba.json")
        market = next(m for m in data["event"]["keyMarketGroups"][0]["markets"] if m["name"] == "|Money Line|")
        market["selections"][0]["active"] = False
        self.assertNotIn("Moneyline", offers(parse_event(data, "nba")))

    def test_fanduel_groups_alternates_by_line(self):
        data = fixture("fanduel-nba.json")
        market = next(m for m in data["attachments"]["markets"].values() if m["marketName"] == "Total Points")
        market["marketName"] = "Alternate Total Points"
        market["runners"] = [
            {"runnerName": f"{side} ({line})", "handicap": 0, "runnerStatus": "ACTIVE",
             "winRunnerOdds": {"americanDisplayOdds": {"americanOdds": -110}}}
            for line in (210.5, 220.5) for side in ("Over", "Under")
        ]
        markets = offers(parse_attachments(data, "nba"))
        self.assertIn("Total: 210.5", markets)
        self.assertIn("Total: 220.5", markets)

    def test_schema_changes_raise_instead_of_becoming_empty_schedules(self):
        for parser in (parse_fixtures, parse_attachments, parse_league, parse_event):
            with self.subTest(parser=parser.__name__), self.assertRaises(FeedError):
                parser({"message": "schema changed"}, "nba")

    def test_utah_alias_and_event_separator_inside_a_team_name(self):
        # 'at' occurs inside Golden State; only delimited separators count.
        event, start = event_info("Golden State Warriors @ Boston Celtics", "2026-11-14T01:00:00.123Z", "nba")
        self.assertEqual(event, "BOS Celtics vs GS Warriors")
        self.assertEqual(start.microsecond, 123000)
        event, _ = event_info("Utah Mammoth at New York Rangers", "2026-11-14T01:00:00Z", "nhl")
        self.assertEqual(event, "NY Rangers vs UTA Mammoth")


class WebsiteSchemaTests(unittest.TestCase):
    """Representative DTOs from public JS. These do not prove live API access."""
    def test_draftkings_nba_matches_browser_capture_and_selected_state(self):
        from urllib.parse import parse_qs, urlsplit
        import requests

        client = Mock(region="mo")
        client.get_json.return_value = {"events": [], "markets": [], "selections": []}
        self.assertEqual(fetch_draftkings("nba", client), {})
        url = client.get_json.call_args.args[0]
        params = client.get_json.call_args.kwargs["params"]
        prepared = requests.Request("GET", url, params=params).prepare()
        parts = urlsplit(prepared.url)
        self.assertEqual(parts.path, "/sites/US-MO-SB/api/sportscontent/controldata/league/leagueSubcategory/v1/markets")
        query = {key: values[0] for key, values in parse_qs(parts.query).items()}
        self.assertEqual(query, {
            "isBatchable": "false", "templateVars": "42648",
            "eventsQuery": "$filter=leagueId eq '42648' AND clientMetadata/Subcategories/any(s: s/Id eq '4511')",
            "marketsQuery": "$filter=clientMetadata/subCategoryId eq '4511' AND tags/all(t: t ne 'SportcastBetBuilder')",
            "include": "Events", "entity": "events",
        })

    def test_draftkings_nba_subcategory_is_not_reused_for_hockey(self):
        client = Mock(region="nj")
        client.get_json.return_value = {"events": [], "markets": [], "selections": []}
        self.assertEqual(fetch_draftkings("nhl", client), {})
        url = client.get_json.call_args.args[0]
        self.assertIn("/dkusnj/v1/leagues/42133", url)
        self.assertNotIn("4511", url)

    def test_draftkings_stadium_arrays_points_and_unicode_minus(self):
        data = {
            "events": [{"id": "e", "name": "Boston Celtics @ New York Knicks", "startEventDate": "2026-11-14T01:00:00Z", "status": "NOT_STARTED"}],
            "markets": [{"id": "m", "eventId": "e", "name": "Spread", "isSuspended": False}],
            "selections": [
                {"id": "a", "marketId": "m", "label": "Boston Celtics", "points": -2.5, "displayOdds": {"american": "−110"}},
                {"id": "b", "marketId": "m", "label": "New York Knicks", "points": 2.5, "displayOdds": {"american": "+100"}},
            ],
        }
        self.assertEqual(offers(parse_league(data, "nba")), ["Spread: BOS Celtics: -2.5"])
        data["markets"][0]["isSuspended"] = True
        self.assertEqual(parse_league(data, "nba"), {})

    def test_caesars_v4_home_handicap_sign_and_nested_groups(self):
        data = {"event": {
            "name": "|Boston Celtics| at |New York Knicks|", "startTime": "2026-11-14T01:00:00Z",
            "active": True, "display": True, "started": False,
            "keyMarketGroups": [{"isOddsBoost": False, "markets": [{
                "name": "|Spread|", "active": True, "display": True, "line": -2.5,
                "selections": [
                    {"name": "|New York Knicks|", "type": "home", "price": {"a": -110}},
                    {"name": "|Boston Celtics|", "type": "away", "price": {"a": 100}},
                ],
            }]}],
        }}
        self.assertEqual(offers(parse_event(data, "nba")), ["Spread: NY Knicks: -2.5"])
        data["event"]["started"] = True
        self.assertEqual(parse_event(data, "nba"), {})


class MatchingTests(unittest.TestCase):
    def test_seven_digit_capture_timestamp_is_compatible_with_legacy_parser(self):
        # strptime's %f enforces the older six-digit limit even on Python 3.13.
        def legacy_parse(value):
            return datetime.strptime(value, "%Y-%m-%dT%H:%M:%S.%f%z")

        with patch("markets.datetime") as date_type:
            date_type.fromisoformat.side_effect = legacy_parse
            self.assertEqual(parse_start("2026-11-14T00:10:00.0000000Z"), datetime(2026, 11, 14, 0, 10))
            self.assertEqual(parse_start("2026-11-13T18:10:00.1234567-06:00"), datetime(2026, 11, 14, 0, 10, 0, 123456))

    def test_different_start_conventions_merge_but_doubleheaders_do_not(self):
        start = datetime(2026, 11, 14, 1)
        rows = main.aggregate({
            "a": {"nba": sample_events(start)},
            "b": {"nba": sample_events(start + timedelta(minutes=8))},
            "c": {"nba": sample_events(start + timedelta(hours=3))},
        })
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["outcomes"][0]["books"][-110], ["a", "b"])

    def test_mismatched_total_and_spread_lines_are_rejected(self):
        events, start = {}, datetime(2026, 11, 14, 1)
        for kind, names, lines in [("total", ["Over", "Under"], [210.5, 211.5]), ("spread", ["Celtics", "Knicks"], [-2.5, 3.5])]:
            self.assertFalse(add_market(events, "nba", "BOS Celtics vs NY Knicks", start, kind, [
                {"name": name, "line": line, "odds": -110} for name, line in zip(names, lines)
            ]))
        self.assertEqual(events, {})

    def test_zero_spreads_have_a_stable_key(self):
        start, data = datetime(2026, 11, 14, 1), {}
        for teams in [("Knicks", "Celtics"), ("Celtics", "Knicks")]:
            add_market(data, "nba", "BOS Celtics vs NY Knicks", start, "spread", [
                {"name": team, "line": 0, "odds": -110} for team in teams
            ])
        self.assertEqual(offers(data), ["Spread: BOS Celtics: 0.0"])

    def test_missing_time_and_none_feed_do_not_crash_aggregation(self):
        self.assertEqual(main.aggregate({"failed": {"nba": None}, "unknown": {"nba": {"x": {None: {"offers": {}}}}}}), [])


class FailureHandlingTests(unittest.TestCase):
    def test_request_diagnostics_identify_unfinished_requests_without_secrets(self):
        client = FeedClient()
        output = io.StringIO()
        try:
            with redirect_stdout(output), patch.object(client, "_get_json", side_effect=FeedError("private-error")):
                with self.assertRaises(FeedError):
                    client.get_json("https://example.com/feed?key=private-query", headers={"Authorization": "private-header"})
            records = [json.loads(line) for line in output.getvalue().splitlines()]
            self.assertEqual([record["phase"] for record in records], ["start", "error"])
            self.assertEqual(records[0]["host"], "example.com")
            self.assertEqual(records[0]["path"], "/feed")
            self.assertGreaterEqual(records[1]["duration_ms"], 0)
            self.assertNotIn("private-", output.getvalue())
        finally:
            client.close()

    def test_proxy_routes_caesars_only_and_keeps_existing_timeouts(self):
        proxy = "https://test-user:test-password@proxy.example:8443"
        with patch.dict(os.environ, {"CAESARS_PROXY_URL": proxy}):
            client = FeedClient()
        response = Mock(status_code=200, ok=True, headers={"Content-Type": "application/json"})
        response.json.return_value = {}
        with patch.object(client.session, "get", return_value=response) as get:
            for path in ("/sports/basketball/schedule", "/events/example"):
                client.get_json("https://api.americanwagering.com" + path)
                self.assertEqual(get.call_args.kwargs["proxies"], {"http": proxy, "https": proxy})
                self.assertEqual(get.call_args.kwargs["timeout"], (5, 20))
                self.assertNotIn("verify", get.call_args.kwargs)
            for host in ("cf-us1-cds-api.itsfogo.com", "sbapi.nj.sportsbook.fanduel.com", "api.americanwagering.com.example"):
                client.get_json("https://" + host + "/feed")
                self.assertNotIn("proxies", get.call_args.kwargs)
        with patch("http_client.browser_requests.Session") as browser:
            browser.return_value.get.return_value = response
            client.get_json("https://sportsbook-nash.draftkings.com/feed")
            self.assertNotIn("proxies", browser.return_value.get.call_args.kwargs)
            client.close()

    def test_unconfigured_caesars_proxy_keeps_existing_routing(self):
        with patch.dict(os.environ, {"CAESARS_PROXY_URL": ""}):
            client = FeedClient()
        self.assertNotIn("proxies", client.request_options("https://api.americanwagering.com/feed"))
        client.close()

    def test_invalid_proxy_configuration_does_not_disable_other_books_or_expose_secrets(self):
        for proxy in ("socks5://test-user:test-password@proxy.example:1080", "https://test-user:test-password@", "https://test-user:test-password@proxy.example:invalid", "https://[invalid"):
            with self.subTest(proxy=proxy), patch.dict(os.environ, {"CAESARS_PROXY_URL": proxy}):
                client = FeedClient()
                with patch.object(client.session, "get") as get:
                    with self.assertRaises(FeedError) as context:
                        client.get_json("https://api.americanwagering.com/feed")
                    self.assertIn("CAESARS_PROXY_URL", str(context.exception))
                    self.assertNotIn(proxy, str(context.exception))
                    self.assertNotIn("test-password", str(context.exception))
                    get.assert_not_called()
                self.assertNotIn("proxies", client.request_options("https://sbapi.nj.sportsbook.fanduel.com/feed"))
                client.close()

    def test_proxy_connection_failure_does_not_expose_credentials(self):
        import requests

        proxy = "https://test-user:test-password@proxy.example:8443"
        with patch.dict(os.environ, {"CAESARS_PROXY_URL": proxy}):
            client = FeedClient()
        with patch.object(client.session, "get", side_effect=requests.exceptions.ProxyError("Failed: " + proxy)):
            with self.assertRaises(FeedError) as context:
                client.get_json("https://api.americanwagering.com/feed")
        self.assertIn("ProxyError", str(context.exception))
        self.assertNotIn("test-password", str(context.exception))
        self.assertNotIn(proxy, str(context.exception))
        client.close()

    def test_caesars_public_metadata_is_consistent_and_does_not_leak_to_other_books(self):
        import requests
        import uuid

        def response(payload):
            result = requests.Response()
            result.status_code = 200
            result.headers["Content-Type"] = "application/json"
            result._content = json.dumps(payload).encode("utf-8")
            return result

        nba, nhl = fixture("caesars-nba.json"), fixture("caesars-nhl.json")
        replies = [
            response([{"eventId": nba["event"]["id"], "started": False}]), response(nba),
            response([{"eventId": nhl["event"]["id"], "started": False}]), response(nhl),
        ]
        client = FeedClient("mo")
        generated_id = uuid.UUID("00000000-0000-4000-8000-000000000001")
        with patch("books.caesars.caesars.uuid.uuid4", return_value=generated_id) as make_id:
            with patch.object(client.session, "send", side_effect=replies) as send:
                self.assertEqual(main.counts(fetch_caesars("nba", client))["markets"], 3)
                self.assertEqual(main.counts(fetch_caesars("nhl", client))["markets"], 3)
                with patch("http_client.browser_requests.Session") as browser:
                    browser.return_value.get.return_value = response({"events": [], "markets": [], "selections": []})
                    fetch_draftkings("nba", client)
        self.assertEqual(make_id.call_count, 1)
        requests_sent = [call.args[0] for call in send.call_args_list]
        for prepared in requests_sent[:4]:
            self.assertIn("/locations/mo/brands/czr/sb/v4/", prepared.url)
            self.assertEqual(prepared.headers["X-Unique-Device-Id"], str(generated_id))
            self.assertEqual(prepared.headers["X-Platform-Type"], "W")
            self.assertEqual(prepared.headers["X-Platform"], "rn-web")
            self.assertEqual(prepared.headers["X-App-Version"], "10.7.7")
            self.assertEqual(prepared.headers["Content-Type"], "application/json")
        for prepared in requests_sent:
            self.assertNotIn("Authorization", prepared.headers)
            self.assertNotIn("x-aws-waf-token", prepared.headers)
            self.assertNotIn("Cookie", prepared.headers)
        self.assertNotIn("X-Unique-Device-Id", browser.call_args.kwargs["headers"])
        self.assertIsNone(browser.return_value.get.call_args.kwargs["headers"])
        self.assertNotIn("X-Platform", client.session.headers)
        client.close()

    def test_draftkings_uses_browser_transport_and_closes_it(self):
        import requests

        client = FeedClient("mo")
        response = requests.Response()
        response.status_code = 200
        response.headers["Content-Type"] = "application/json"
        response._content = b'{"events": [], "markets": [], "selections": []}'
        with patch("http_client.browser_requests.Session") as browser, patch.object(client.session, "get") as regular:
            browser.return_value.get.return_value = response
            fetch_draftkings("nba", client)
            fetch_draftkings("nba", client)
            self.assertEqual(browser.call_count, 1)
            self.assertEqual(browser.call_args.kwargs["impersonate"], "chrome")
            self.assertEqual(browser.return_value.get.call_count, 2)
            self.assertEqual(browser.return_value.get.call_args.kwargs["timeout"], (5, 20))
            self.assertNotIn("Cookie", browser.call_args.kwargs["headers"])
            regular.assert_not_called()
            client.close()
            browser.return_value.close.assert_called_once()

    def test_http_403_and_html_redirects_are_explicit_errors(self):
        client = FeedClient()
        with patch.object(client.session, "get") as get:
            get.return_value = Mock(status_code=403)
            with self.assertRaises(FeedError) as context:
                client.get_json("https://example.com/feed")
            self.assertEqual(context.exception.state, "blocked")
            get.return_value = Mock(status_code=200, ok=True, headers={"Content-Type": "text/html"}, url="https://example.com/closed")
            with self.assertRaises(FeedError) as context:
                client.get_json("https://example.com/feed")
            self.assertEqual(context.exception.state, "unexpected_response")
            self.assertEqual(get.call_args.kwargs["timeout"], (5, 20))
        client.close()

    def test_browser_transport_preserves_access_and_network_failure_states(self):
        from curl_cffi.requests import RequestsError

        client = FeedClient()
        with patch("http_client.browser_requests.Session") as browser:
            browser.return_value.get.side_effect = RequestsError("Connection failed")
            with self.assertRaises(FeedError) as context:
                client.get_json("https://sportsbook-nash.draftkings.com/feed")
            self.assertEqual(context.exception.state, "error")
            browser.return_value.get.side_effect = None
            browser.return_value.get.return_value = Mock(status_code=403)
            with self.assertRaises(FeedError) as context:
                client.get_json("https://sportsbook-nash.draftkings.com/feed")
            self.assertEqual(context.exception.state, "blocked")
            client.close()

    def test_one_failed_book_does_not_discard_successful_data(self):
        with patch.dict(main.FETCHERS, {"betmgm": lambda sport, client: sample_events(), "fanduel": Mock(side_effect=FeedError("403", "blocked"))}, clear=True):
            rows, report = main.collect(sports=("nba",))
        self.assertEqual(len(rows), 1)
        self.assertEqual(report["state"], "partial")
        self.assertEqual(report["books"]["fanduel"]["state"], "blocked")

    def test_all_failed_preserves_last_output_and_writes_failure_report(self):
        with tempfile.TemporaryDirectory() as folder:
            output, status = pathlib.Path(folder) / "output.json", pathlib.Path(folder) / "status.json"
            output.write_text('["previous"]', encoding="utf8")
            with patch.object(main, "collect", return_value=([], {"state": "failed"})):
                main.local(output=output, status_output=status)
            self.assertEqual(json.loads(output.read_text()), ["previous"])
            self.assertEqual(json.loads(status.read_text())["state"], "failed")

    def test_warm_lambda_refreshes_on_every_invocation(self):
        s3 = Mock()
        boto = types.SimpleNamespace(client=Mock(return_value=s3))
        with patch.dict(sys.modules, {"boto3": boto}), patch.object(main, "collect", return_value=([{"fresh": True}], {"state": "partial"})) as collect:
            main.lambda_handler({}, None)
            main.lambda_handler({}, None)
        self.assertEqual(collect.call_count, 2)
        self.assertEqual(s3.put_object.call_count, 4)

    def test_importing_main_has_no_network_side_effects(self):
        with patch("requests.Session.get", side_effect=AssertionError("Network at import")):
            importlib.reload(main)


if __name__ == "__main__":
    unittest.main()
