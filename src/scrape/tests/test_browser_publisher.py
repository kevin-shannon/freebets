"""Real local HTTP bridge: capture uploads, freshness, parsing and failure isolation."""
from contextlib import redirect_stdout
from datetime import datetime, timedelta, timezone
import io
import os
from pathlib import Path
import sys
import threading
import unittest
from unittest.mock import Mock, patch

import requests

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src/scrape"))
from caesars_relay.server import make_server
from books.bet365.bet365 import parse_markets
from http_client import FeedClient
import main

BODY = (Path(__file__).parent / "fixtures/bet365-nba.txt").read_bytes()
TOKEN = "publisher-test-token-" + "a" * 48


class BrowserPublisherTests(unittest.TestCase):
    def setUp(self):
        self.clock = 0
        self.upstream = Mock(side_effect=AssertionError("Browser captures must not call an upstream"))
        self.server = make_server(("127.0.0.1", 0), TOKEN, fetch=self.upstream, enable_bet365=True,
                                  bet365_source="browser", capture_clock=lambda: self.clock)
        self.thread = threading.Thread(target=lambda: self.server.serve_forever(poll_interval=0.01), daemon=True)
        self.thread.start()
        self.origin = "http://127.0.0.1:" + str(self.server.server_port)
        self.headers = {"Authorization": "Bearer " + TOKEN}

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def post(self, body=BODY, **headers):
        return requests.post(self.origin + "/bet365/capture", data=body, headers={**self.headers,
            "Content-Type": "text/plain;charset=UTF-8", "X-Freebets-Observed-At": datetime.now(timezone.utc).isoformat(), **headers}, timeout=2)

    def get(self):
        return requests.get(self.origin + "/bet365/nba", headers=self.headers, timeout=2)

    def test_capture_requires_auth_and_is_missing_until_a_valid_upload(self):
        self.assertEqual(requests.post(self.origin + "/bet365/capture", data=BODY, timeout=2).status_code, 401)
        response = self.get()
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.headers["X-Freebets-Relay-Error"], "capture_missing")
        response = self.post()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["state"], "accepted")
        response = self.get()
        self.assertEqual(response.content, BODY)
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        self.assertLess(float(response.headers["X-Freebets-Capture-Age-Seconds"]), 2)
        self.assertIn("X-Freebets-Capture-Observed-At", response.headers)
        self.upstream.assert_not_called()

    def test_expiry_removes_quotes_and_invalid_uploads_do_not_refresh_the_clock(self):
        self.assertEqual(self.post().status_code, 200)
        self.clock = 119
        self.assertEqual(self.get().status_code, 200)
        self.assertEqual(self.post(b"<html>challenge</html>").status_code, 400)
        self.clock = 121
        response = self.get()
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.headers["X-Freebets-Relay-Error"], "capture_stale")
        self.assertNotIn("OD=", response.text)
        self.assertEqual(self.post().status_code, 200)
        self.assertEqual(self.get().status_code, 200)

    def test_old_future_and_wrong_league_captures_are_rejected(self):
        for offset in [-60, 60]:
            when = (datetime.now(timezone.utc) + timedelta(seconds=offset)).isoformat()
            self.assertEqual(self.post(**{"X-Freebets-Observed-At": when}).status_code, 400)
        self.assertEqual(self.post(BODY.replace(b"L3=NBA", b"L3=Other")).status_code, 400)
        self.assertEqual(self.post(**{"Content-Type": "application/json"}).status_code, 400)
        self.assertEqual(self.post(**{"X-Freebets-Trace-Id": "invalid-private-value"}).status_code, 400)
        self.assertEqual(self.get().status_code, 503)
        self.assertEqual(requests.post(self.origin + "/bet365/capture?url=https://example.com", headers=self.headers, timeout=2).status_code, 405)

    def test_an_older_upload_cannot_replace_a_newer_capture(self):
        when = datetime.now(timezone.utc)
        self.assertEqual(self.post(**{"X-Freebets-Observed-At": (when - timedelta(seconds=1)).isoformat()}).status_code, 200)
        original = self.get().headers["X-Freebets-Capture-Id"]
        response = self.post(**{"X-Freebets-Observed-At": (when - timedelta(seconds=2)).isoformat()})
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.get().headers["X-Freebets-Capture-Id"], original)

    def test_receiver_is_disabled_by_default_and_restarts_with_no_capture(self):
        self.server.enable_bet365 = False
        self.assertEqual(self.post().status_code, 404)
        self.server.enable_bet365 = True
        self.assertEqual(self.post().status_code, 200)
        self.server.bet365_capture = None  # A fresh process has no stored quotes.
        self.assertEqual(self.get().headers["X-Freebets-Relay-Error"], "capture_missing")

    def test_enabled_collector_reads_fresh_capture_and_removes_it_after_expiry_without_losing_other_books(self):
        self.assertEqual(self.post().status_code, 200)
        variables = {"BET365_ENABLED": "true", "BET365_REGION": "mo", "BET365_RELAY_URL": self.origin,
                     "BET365_RELAY_TOKEN": TOKEN, "BET365_RELAY_ACCESS_CLIENT_ID": "", "BET365_RELAY_ACCESS_CLIENT_SECRET": "",
                     "CAESARS_RELAY_URL": "", "CAESARS_PROXY_URL": ""}
        def other_book(sport, client):
            return parse_markets(BODY.decode()) if sport == "nba" else {}
        with patch.dict(os.environ, variables), patch.dict(main.FETCHERS, {"betmgm": other_book}, clear=True), redirect_stdout(io.StringIO()):
            rows, report = main.collect()
            self.assertEqual(report["state"], "ok")
            book = report["books"]["bet365"]
            self.assertEqual(book["state"], "ok")
            self.assertEqual(book["region"], "mo")
            self.assertEqual(book["source"], "browser_capture")
            self.assertEqual(book["supportedSports"], ["nba"])
            self.assertEqual(book["sports"]["nhl"]["state"], "unsupported")
            self.assertTrue(any("bet365" in books for row in rows for outcome in row["outcomes"] for books in outcome["books"].values()))
            self.clock = 121
            rows, report = main.collect()
            self.assertEqual(report["state"], "partial")
            self.assertEqual(report["books"]["bet365"]["sports"]["nba"]["state"], "stale")
            self.assertTrue(rows)
            self.assertTrue(all("bet365" not in books for row in rows for outcome in row["outcomes"] for books in outcome["books"].values()))
        self.upstream.assert_not_called()
