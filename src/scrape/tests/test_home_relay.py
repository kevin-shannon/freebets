"""Exercise the home relay over HTTP, including its network and credential boundaries."""
import json
import io
import os
from pathlib import Path
import sys
import threading
import unittest
from datetime import datetime
from contextlib import redirect_stdout
from unittest.mock import MagicMock, Mock, patch

import requests

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src/scrape"))

from caesars_relay.server import make_server, fetch_upstream, BET365_PATH, BET365_UPSTREAM
from books.caesars.caesars import COMPETITIONS
from http_client import FeedClient, FeedError
import main

TOKEN = "test-relay-token-" + "a" * 48
PREFIX = "/regions/us/locations/nj/brands/czr/sb/v4"
SCHEDULE = PREFIX + "/sports/basketball/schedule?competitionId=" + COMPETITIONS["nba"][1]
DEVICE_ID = "00000000-0000-4000-8000-000000000001"


class HomeRelayTests(unittest.TestCase):
    def test_bet365_is_opt_in_and_cannot_choose_another_target_or_query(self):
        self.assertEqual(requests.get(self.origin + BET365_PATH, headers=self.headers, timeout=2).status_code, 400)
        self.server.enable_bet365 = True
        for path in [BET365_PATH + "?url=https://example.com", BET365_PATH + "?pd=other", "/bet365/nhl", "/bet365/nba/", "/bet365/account"]:
            with self.subTest(path=path):
                self.assertEqual(requests.get(self.origin + path, headers=self.headers, timeout=2).status_code, 400)
        self.upstream.assert_not_called()

    def test_bet365_pipe_text_authentication_headers_and_trace(self):
        self.server.enable_bet365 = True
        payload = (Path(__file__).parent / "fixtures/bet365-nba.txt").read_bytes()
        self.upstream.return_value = (200, payload)
        self.assertEqual(requests.get(self.origin + BET365_PATH, timeout=2).status_code, 401)
        headers = {**self.headers, "Cookie": "private-cookie", "CF-Access-Client-Secret": "private-access",
                   "X-Platform": "rn-web", "Referer": "https://example.com/", "X-Freebets-Trace-Id": DEVICE_ID}
        with self.assertLogs("caesars_relay.server", level="INFO") as logged:
            response = requests.get(self.origin + BET365_PATH, headers=headers, timeout=2)
        self.assertEqual(response.content, payload)
        self.assertEqual(response.headers["Content-Type"], "text/plain; charset=utf-8")
        url, sent = self.upstream.call_args.args
        self.assertEqual(url, BET365_UPSTREAM)
        self.assertEqual(sent["Referer"], "https://www.mo.bet365.com/")
        for header in ("Authorization", "Cookie", "CF-Access-Client-Secret", "X-Unique-Device-Id", "X-Platform"):
            self.assertNotIn(header, sent)
        record = json.loads(logged.records[0].getMessage())
        self.assertEqual(record["event"], "bet365_relay_request")
        self.assertEqual(record["kind"], "markets")
        self.assertEqual(record["trace_id"], DEVICE_ID)

    def test_bet365_collection_through_home_relay_reuses_auth_and_keeps_other_books_separate(self):
        self.server.enable_bet365 = True
        self.upstream.return_value = (200, (Path(__file__).parent / "fixtures/bet365-nba.txt").read_bytes())
        client = self.client(BET365_RELAY_URL=self.origin,
                             CAESARS_RELAY_ACCESS_CLIENT_ID="test-access-id",
                             CAESARS_RELAY_ACCESS_CLIENT_SECRET="test-access-secret")
        client.region = "mo"
        client.bet365_region = "mo"
        try:
            with patch.object(main, "FeedClient", return_value=client), redirect_stdout(io.StringIO()):
                rows, report = main.collect(books=["bet365"], sports=["nba"], region="mo")
            self.assertEqual(len(rows), 6)
            self.assertEqual(report["books"]["bet365"]["transport"], "home_relay")
            self.assertEqual(report["books"]["bet365"]["relayRequests"], 1)
            self.assertEqual(client.caesars_relay_requests, 0)
            self.assertEqual(client.bet365_relay_token, TOKEN)
            self.assertEqual(client.bet365_access_id, "test-access-id")
            self.assertEqual(self.upstream.call_args.args[0], BET365_UPSTREAM)
        finally:
            client.close()

    def test_bet365_relay_outage_does_not_disable_caesars(self):
        client = self.client(BET365_RELAY_URL=self.origin)
        try:
            with patch.object(client.session, "get", side_effect=requests.Timeout("secret")) as get, redirect_stdout(io.StringIO()):
                for _ in range(2):
                    with self.assertRaises(FeedError):
                        client.get_text("https://www.mo.bet365.com/contentdata/matchmarketscontentapi/markets")
                self.assertEqual(get.call_count, 1)
            self.assertIsNone(client.caesars_relay_failure)
            self.assertIsNotNone(client.bet365_relay_failure)
        finally:
            client.close()

    def setUp(self):
        clock = patch("books.bet365.bet365.utc_now", return_value=datetime(2026, 11, 15, 12))
        clock.start()
        self.addCleanup(clock.stop)
        self.upstream = Mock(return_value=(200, b"[]"))
        self.server = make_server(("127.0.0.1", 0), TOKEN, fetch=self.upstream)
        self.thread = threading.Thread(target=lambda: self.server.serve_forever(poll_interval=0.01), daemon=True)
        self.thread.start()
        self.origin = "http://127.0.0.1:" + str(self.server.server_port)
        self.headers = {"Authorization": "Bearer " + TOKEN, "X-Unique-Device-Id": DEVICE_ID}

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def client(self, **options):
        values = {
            "CAESARS_RELAY_URL": self.origin, "CAESARS_RELAY_TOKEN": TOKEN,
            "CAESARS_RELAY_ACCESS_CLIENT_ID": "", "CAESARS_RELAY_ACCESS_CLIENT_SECRET": "",
            "CAESARS_PROXY_URL": "", **options,
        }
        with patch.dict(os.environ, values):
            return FeedClient()

    def test_liveness_is_available_but_odds_require_authentication(self):
        self.assertEqual(requests.get(self.origin + "/health", timeout=2).json(), {"status": "ok"})
        for headers in ({}, {"Authorization": "Bearer wrong"}):
            self.assertEqual(requests.get(self.origin + SCHEDULE, headers=headers, timeout=2).status_code, 401)
        self.upstream.assert_not_called()

    def test_only_public_headers_reach_caesars(self):
        headers = {**self.headers, "User-Agent": "test-browser", "X-Platform": "rn-web",
                   "CF-Access-Client-Secret": "test-access-secret", "Cookie": "test-home-cookie",
                   "Proxy-Authorization": "test-proxy-secret", "X-Forwarded-For": "192.0.2.1"}
        response = requests.get(self.origin + SCHEDULE, headers=headers, timeout=2)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Cache-Control"], "no-store")
        url, sent = self.upstream.call_args.args
        self.assertEqual(url, "https://api.americanwagering.com" + SCHEDULE)
        self.assertEqual(sent, {"User-Agent": "test-browser", "X-Platform": "rn-web", "X-Unique-Device-Id": DEVICE_ID, "Accept": "*/*"})

    def test_request_log_and_response_share_trace_without_credentials_or_health_noise(self):
        trace = "11111111-1111-4111-8111-111111111111"
        headers = {**self.headers, "X-Freebets-Trace-Id": trace,
                   "CF-Access-Client-Secret": "test-access-secret", "Cookie": "test-cookie"}
        with self.assertLogs("caesars_relay.server", level="INFO") as output:
            requests.get(self.origin + "/health", timeout=2)
            response = requests.get(self.origin + SCHEDULE, headers=headers, timeout=2)
        self.assertEqual(response.headers["X-Freebets-Trace-Id"], trace)
        self.assertEqual(len(output.records), 1)
        message = output.records[0].getMessage()
        record = json.loads(message)
        self.assertEqual(record["trace_id"], trace)
        self.assertEqual(record["kind"], "schedule")
        self.assertEqual(record["status"], 200)
        self.assertEqual(record["upstream_status"], 200)
        self.assertTrue(record["time"].endswith("Z"))
        for value in (TOKEN, "test-access-secret", "test-cookie", DEVICE_ID, COMPETITIONS["nba"][1], "127.0.0.1"):
            self.assertNotIn(value, message)
        self.assertNotIn("X-Freebets-Trace-Id", self.upstream.call_args.args[1])

    def test_invalid_trace_is_rejected_without_logging_its_value(self):
        with self.assertLogs("caesars_relay.server", level="INFO") as output:
            response = requests.get(self.origin + SCHEDULE, headers={**self.headers, "X-Freebets-Trace-Id": "test-secret"}, timeout=2)
        self.assertEqual(response.status_code, 400)
        self.assertNotIn("test-secret", output.records[0].getMessage())
        self.upstream.assert_not_called()

    def test_invalid_targets_and_queries_never_contact_upstream(self):
        paths = [
            "/https://example.com/", "//169.254.169.254/latest/meta-data/",
            SCHEDULE.replace("/locations/nj/", "/locations/mo/"),
            SCHEDULE.replace("basketball", "unknown"),
            SCHEDULE + "&url=http://127.0.0.1:8123/", SCHEDULE + "&competitionId=" + COMPETITIONS["nba"][1],
            PREFIX + "/sports/basketball/schedule?competitionId=invalid",
            PREFIX + "/events/331fdfe5-f39c-48a2-b560-3d829fad2e96?useEventPayloadWithTabNav=false",
            PREFIX + "/events/%2e%2e?useEventPayloadWithTabNav=true",
            PREFIX + "/account", PREFIX + "/sports/basketball/schedule",
        ]
        for path in paths:
            with self.subTest(path=path):
                self.assertEqual(requests.get(self.origin + path, headers=self.headers, timeout=2).status_code, 400)
        self.upstream.assert_not_called()

    def test_write_methods_and_request_bodies_are_rejected(self):
        for method in ("POST", "PUT", "PATCH", "DELETE", "CONNECT"):
            with self.subTest(method=method):
                self.assertEqual(requests.request(method, self.origin + SCHEDULE, headers=self.headers, timeout=2).status_code, 405)
        self.assertEqual(requests.get(self.origin + SCHEDULE, headers=self.headers, data="body", timeout=2).status_code, 400)
        self.upstream.assert_not_called()

    def test_client_parses_recorded_odds_through_relay_and_credentials_stop_at_home(self):
        payload = json.loads((Path(__file__).parent / "fixtures/caesars-nba.json").read_text())
        def upstream(url, headers):
            if "/schedule?" in url:
                return 200, json.dumps([{"eventId": payload["event"]["id"], "started": False}]).encode()
            return 200, json.dumps(payload).encode()
        self.upstream.side_effect = upstream
        client = self.client(CAESARS_PROXY_URL="invalid-unused-proxy",
                             CAESARS_RELAY_ACCESS_CLIENT_ID="test-access-id",
                             CAESARS_RELAY_ACCESS_CLIENT_SECRET="test-access-secret")
        try:
            console = io.StringIO()
            with patch.object(main, "FeedClient", return_value=client), redirect_stdout(console):
                rows, report = main.collect(books=("caesars",), sports=("nba",))
            self.assertEqual(len(rows), 3)
            self.assertEqual(report["books"]["caesars"]["transport"], "home_relay")
            self.assertEqual(report["books"]["caesars"]["relayTraceId"], client.caesars_relay_trace_id)
            self.assertEqual(report["books"]["caesars"]["relayRequests"], 2)
            self.assertIn("transport=home_relay trace_id=" + client.caesars_relay_trace_id, console.getvalue())
            self.assertEqual(self.upstream.call_count, 2)
            for call in self.upstream.call_args_list:
                headers = call.args[1]
                self.assertIn("Chrome/", headers["User-Agent"])
                for name in ("Authorization", "CF-Access-Client-Id", "CF-Access-Client-Secret", "Cookie"):
                    self.assertNotIn(name, headers)
                    self.assertNotIn(name, client.session.headers)
            response = Mock(status_code=200, ok=True, headers={"Content-Type": "application/json"})
            response.json.return_value = {}
            with patch.object(client.session, "get", return_value=response) as get:
                client.get_json("https://sbapi.nj.sportsbook.fanduel.com/feed")
                self.assertIsNone(get.call_args.kwargs["headers"])
        finally:
            client.close()

    def test_caesars_denial_remains_a_book_access_failure(self):
        self.upstream.return_value = (403, b"")
        client = self.client()
        try:
            with self.assertRaises(FeedError) as context:
                client.get_json("https://api.americanwagering.com" + SCHEDULE, headers={"X-Unique-Device-Id": DEVICE_ID})
            self.assertEqual(context.exception.state, "blocked")
            self.assertIn("public feed access denied", str(context.exception))
        finally:
            client.close()

    def test_relay_authentication_error_is_distinct_from_caesars_denial(self):
        client = self.client(CAESARS_RELAY_TOKEN="b" * 64)
        try:
            with self.assertRaises(FeedError) as context:
                client.get_json("https://api.americanwagering.com" + SCHEDULE)
            self.assertEqual(context.exception.state, "error")
            self.assertIn("home relay HTTP 401", str(context.exception))
        finally:
            client.close()

    def test_upstream_redirects_and_network_errors_are_not_forwarded(self):
        self.upstream.return_value = (302, b"")
        response = requests.get(self.origin + SCHEDULE, headers=self.headers, timeout=2)
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("Location", response.headers)
        self.upstream.side_effect = requests.Timeout("private test value")
        response = requests.get(self.origin + SCHEDULE, headers=self.headers, timeout=2)
        self.assertEqual(response.status_code, 502)
        self.assertNotIn("private test value", response.text)

    def test_relay_redirect_never_forwards_access_credentials_to_another_host(self):
        client = self.client(CAESARS_RELAY_ACCESS_CLIENT_ID="test-id", CAESARS_RELAY_ACCESS_CLIENT_SECRET="test-secret")
        response = Mock(status_code=302, headers={"Location": "https://elsewhere.example"})
        try:
            with patch.object(client.session, "get", return_value=response) as get:
                with self.assertRaises(FeedError):
                    client.get_json("https://api.americanwagering.com" + SCHEDULE)
                self.assertFalse(get.call_args.kwargs["allow_redirects"])
                self.assertEqual(get.call_count, 1)
        finally:
            client.close()

    def test_relay_outage_is_attempted_once_per_collection_and_does_not_disable_other_books(self):
        client = self.client()
        try:
            with patch.object(client.session, "get", side_effect=requests.Timeout("test-secret")) as get:
                for sport in ("basketball", "icehockey", "baseball"):
                    with self.assertRaises(FeedError) as context:
                        client.get_json("https://api.americanwagering.com" + SCHEDULE.replace("basketball", sport))
                    self.assertNotIn("test-secret", str(context.exception))
                self.assertEqual(get.call_count, 1)
                get.side_effect = None
                get.return_value = Mock(status_code=200, ok=True, headers={"Content-Type": "application/json"})
                get.return_value.json.return_value = {}
                self.assertEqual(client.get_json("https://sbapi.nj.sportsbook.fanduel.com/feed"), {})
        finally:
            client.close()

    def test_invalid_relay_configuration_fails_before_any_request_without_exposing_secrets(self):
        cases = [
            {"CAESARS_RELAY_URL": "http://relay.example"},
            {"CAESARS_RELAY_URL": "https://test-user:test-password@relay.example"},
            {"CAESARS_RELAY_URL": "https://relay.example/path"},
            {"CAESARS_RELAY_URL": "https://relay.example?token=test-password"},
            {"CAESARS_RELAY_URL": "https://api.americanwagering.com"},
            {"CAESARS_RELAY_TOKEN": ""}, {"CAESARS_RELAY_ACCESS_CLIENT_ID": "missing-pair"},
        ]
        for options in cases:
            with self.subTest(options=options):
                client = self.client(**options)
                try:
                    with patch.object(client.session, "get") as get:
                        with self.assertRaises(FeedError) as context:
                            client.get_json("https://api.americanwagering.com" + SCHEDULE)
                        self.assertNotIn("test-password", str(context.exception))
                        get.assert_not_called()
                finally:
                    client.close()

    def test_relay_requires_a_strong_token_at_startup(self):
        for token in ("", "short", "a" * 32 + " ", "\u00e9" * 32):
            with self.subTest(token=token), self.assertRaises(ValueError):
                make_server(("127.0.0.1", 0), token)


class RelayUpstreamTests(unittest.TestCase):
    def test_bet365_upstream_requires_bounded_pipe_text_and_does_not_solve_challenges(self):
        for content_type, body, valid in [("text/plain", b"F|CL;ID=18;|", True),
                                           ("text/html", b"F|CL;ID=18;|", False),
                                           ("text/plain", b"<html>challenge</html>", False),
                                           ("text/plain", b"F|CL;" + b"x" * 33, False)]:
            response = MagicMock(status_code=200, headers={"Content-Type": content_type})
            response.iter_content.return_value = [body]
            with self.subTest(content_type=content_type, valid=valid), patch("caesars_relay.server.MAX_RESPONSE_BYTES", 32), patch("caesars_relay.server.requests.Session") as session:
                session.return_value.__enter__.return_value.get.return_value.__enter__.return_value = response
                if valid:
                    self.assertEqual(fetch_upstream(BET365_UPSTREAM, {}), (200, body))
                else:
                    with self.assertRaises(ValueError):
                        fetch_upstream(BET365_UPSTREAM, {})

    def test_upstream_uses_direct_connection_and_refuses_redirects(self):
        response = MagicMock(status_code=200, headers={"Content-Type": "application/json"})
        response.iter_content.return_value = [b'{"event": {}}']
        with patch("caesars_relay.server.requests.Session") as session:
            actual = session.return_value.__enter__.return_value
            actual.get.return_value.__enter__.return_value = response
            self.assertEqual(fetch_upstream("https://api.americanwagering.com/feed", {}), (200, b'{"event": {}}'))
            self.assertFalse(actual.trust_env)
            self.assertFalse(actual.get.call_args.kwargs["allow_redirects"])
            self.assertEqual(actual.get.call_args.kwargs["timeout"], (5, 15))

    def test_invalid_and_oversized_payloads_are_rejected(self):
        for content_type, body in (("text/html", b"page"), ("application/json", b"not json"), ("application/json", b"x" * 33)):
            response = MagicMock(status_code=200, headers={"Content-Type": content_type})
            response.iter_content.return_value = [body]
            with self.subTest(content_type=content_type, body=body), patch("caesars_relay.server.MAX_RESPONSE_BYTES", 32), patch("caesars_relay.server.requests.Session") as session:
                session.return_value.__enter__.return_value.get.return_value.__enter__.return_value = response
                with self.assertRaises(ValueError):
                    fetch_upstream("https://api.americanwagering.com/feed", {})
