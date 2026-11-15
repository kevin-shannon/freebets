"""Authenticated Caesars relay and expiring public NBA browser-capture cache."""
import hmac
import json
import logging
import os
import re
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit, urlencode
from uuid import UUID, uuid4

import requests

UPSTREAM = "https://api.americanwagering.com"
BET365_PATH = "/bet365/nba"
BET365_CAPTURE_PATH = "/bet365/capture"
MAX_CAPTURE_BYTES = 1024 * 1024
BET365_UPSTREAM = "https://www.mo.bet365.com/contentdata/matchmarketscontentapi/markets?" + urlencode({
    "lid": "32", "zid": "0", "pd": "#AC#B18#C20604387#D48#E1453#F10#",
    "cid": "198", "cgid": "3", "ctid": "198",
})
PORT = 8787
MAX_RESPONSE_BYTES = 8 * 1024 * 1024
LOGGER = logging.getLogger(__name__)
PUBLIC_HEADERS = (
    "User-Agent", "Accept", "Cache-Control", "Content-Type", "X-Platform-Type",
    "X-Platform", "X-App-Version", "X-Unique-Device-Id",
)


def target_url(path, region, enable_bet365=False):
    parsed = urlsplit(path)
    if path == BET365_PATH and enable_bet365:
        return BET365_UPSTREAM
    prefix = f"/regions/us/locations/{region}/brands/czr/sb/v4"
    if parsed.scheme or parsed.netloc or parsed.fragment or not parsed.path.startswith(prefix + "/"):
        raise ValueError("Unsupported relay path")
    fields = parse_qs(parsed.query, strict_parsing=True, keep_blank_values=True, max_num_fields=2)
    relative = parsed.path[len(prefix):]
    if re.fullmatch(r"/sports/(basketball|icehockey|baseball)/schedule", relative):
        if set(fields) != {"competitionId"} or len(fields["competitionId"]) != 1:
            raise ValueError("Invalid schedule query")
        UUID(fields["competitionId"][0])
    elif re.fullmatch(r"/events/[0-9a-fA-F-]{36}", relative):
        UUID(relative.rsplit("/", 1)[1])
        if fields != {"useEventPayloadWithTabNav": ["true"]}:
            raise ValueError("Invalid event query")
    else:
        raise ValueError("Unsupported relay path")
    return UPSTREAM + parsed.path + "?" + parsed.query


def fetch_upstream(url, headers):
    # Use this machine's ordinary connection, without ambient proxy/netrc settings.
    with requests.Session() as session:
        session.trust_env = False
        with session.get(url, headers=headers, timeout=(5, 15), allow_redirects=False, stream=True) as response:
            if response.status_code != 200:
                return response.status_code, b""
            bet365 = url == BET365_UPSTREAM
            content_type = response.headers.get("Content-Type", "").lower()
            if bet365 and "html" in content_type:
                raise ValueError("Upstream returned HTML instead of feed text")
            if not bet365 and "json" not in content_type:
                raise ValueError("Upstream did not return JSON")
            body = bytearray()
            for chunk in response.iter_content(65536):
                body.extend(chunk)
                if len(body) > MAX_RESPONSE_BYTES:
                    raise ValueError("Upstream response too large")
            if bet365:
                if not body.startswith(b"F|CL;"):
                    raise ValueError("Upstream did not return a complete pipe feed")
                bytes(body).decode("utf-8")
            else:
                json.loads(body)
            return 200, bytes(body)


class RelayHandler(BaseHTTPRequestHandler):
    server_version = "FreebetsRelay/0.3.0"
    sys_version = ""

    def log_message(self, format, *args):
        # Never log incoming headers, credentials, or upstream response bodies.
        pass

    def respond(self, status, body, *, error=None, upstream_status=None, content_type="application/json", extra_headers=None):
        if not isinstance(body, bytes):
            body = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        if error:
            self.send_header("X-Freebets-Relay-Error", error)
        if upstream_status is not None:
            self.send_header("X-Freebets-Upstream-Status", str(upstream_status))
        if getattr(self, "relay_trace_id", None):
            self.send_header("X-Freebets-Trace-Id", self.relay_trace_id)
        for name, value in (extra_headers or {}).items():
            self.send_header(name, str(value))
        self.end_headers()
        self.close_connection = True
        if hasattr(self, "request_started"):
            LOGGER.info(json.dumps({
                "time": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "event": "bet365_relay_request" if getattr(self, "request_book", None) == "bet365" else "caesars_relay_request",
                "trace_id": getattr(self, "relay_trace_id", None),
                "kind": getattr(self, "request_kind", "invalid"), "status": status,
                "upstream_status": getattr(self, "upstream_status", None), "response_bytes": len(body),
                "duration_ms": round((time.monotonic() - self.request_started) * 1000),
                "capture_id": getattr(self, "capture_id", None),
            }))
        try:
            if self.command != "HEAD":
                self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def authenticated(self):
        expected = ("Bearer " + self.server.relay_token).encode("utf-8")
        if not hmac.compare_digest(self.headers.get("Authorization", "").encode("utf-8"), expected):
            self.respond(401, {"error": "unauthorized"}, error="unauthorized")
            return False
        return True

    def cached_bet365(self):
        with self.server.capture_lock:
            capture = self.server.bet365_capture
        if capture is None:
            self.respond(503, {"error": "capture_missing"}, error="capture_missing")
            return
        age = max(0, self.server.capture_clock() - capture["received_clock"])
        age += capture["age_on_receipt"]
        if age >= self.server.bet365_max_age_seconds:
            self.respond(503, {"error": "capture_stale", "age_seconds": round(age, 1)}, error="capture_stale")
            return
        self.capture_id = capture["id"]
        self.respond(200, capture["body"], content_type="text/plain; charset=utf-8", extra_headers={
            "X-Freebets-Capture-Received-At": capture["received_at"],
            "X-Freebets-Capture-Observed-At": capture["observed_at"],
            "X-Freebets-Capture-Age-Seconds": round(age, 1),
            "X-Freebets-Capture-Max-Age-Seconds": self.server.bet365_max_age_seconds,
            "X-Freebets-Capture-Id": capture["id"],
        })

    def do_POST(self):
        if self.path != BET365_CAPTURE_PATH:
            self.unsupported()
            return
        if not self.authenticated():
            return
        self.request_started = time.monotonic()
        self.request_book, self.request_kind = "bet365", "capture"
        if not self.server.enable_bet365 or self.server.bet365_source != "browser":
            self.respond(404, {"error": "browser_capture_disabled"}, error="browser_capture_disabled")
            return
        try:
            trace = self.headers.get("X-Freebets-Trace-Id")
            self.relay_trace_id = str(UUID(trace)) if trace else None
            length = int(self.headers.get("Content-Length", "-1"))
            if "Transfer-Encoding" in self.headers or not 0 < length <= MAX_CAPTURE_BYTES:
                raise ValueError("Invalid capture size")
            if self.headers.get("Content-Type", "").split(";", 1)[0].lower() != "text/plain":
                raise ValueError("Invalid capture type")
            observed = datetime.fromisoformat(self.headers.get("X-Freebets-Observed-At", "").replace("Z", "+00:00"))
            if observed.tzinfo is None:
                raise ValueError("Capture time needs a timezone")
            age_on_receipt = (datetime.now(timezone.utc) - observed).total_seconds()
            if not -5 <= age_on_receipt <= 30:
                raise ValueError("Capture is too old or in the future")
        except ValueError:
            self.respond(400, {"error": "invalid_capture_request"}, error="invalid_request")
            return
        if not self.server.capacity.acquire(blocking=False):
            self.respond(503, {"error": "relay_busy"}, error="relay_busy")
            return
        try:
            try:
                self.connection.settimeout(10)
                body = self.rfile.read(length)
                if len(body) != length:
                    raise ValueError("Incomplete capture")
                text = body.decode("utf-8-sig")
                records = []
                if not text.startswith("F|CL;"):
                    raise ValueError("Invalid feed")
                for record in text.split("|")[1:]:
                    kind, *fields = record.split(";")
                    records.append((kind, dict(field.split("=", 1) for field in fields if "=" in field)))
                if not any(kind == "CL" and row.get("ID") == "18" for kind, row in records) or not any(
                    kind == "EV" and row.get("L3") == "NBA" for kind, row in records
                ) or not any(kind == "MG" and row.get("ID") == "1453" and row.get("SY") == "cmx" for kind, row in records):
                    raise ValueError("Unexpected league layout")
            except (ValueError, UnicodeError, OSError):
                self.respond(400, {"error": "invalid_capture_body"}, error="invalid_capture_body")
                return
            capture = {"body": text.encode("utf-8"), "received_clock": self.server.capture_clock(),
                       "received_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                       "observed_at": observed.astimezone(timezone.utc).isoformat(),
                       "observed_epoch": observed.timestamp(),
                       "age_on_receipt": max(0, age_on_receipt), "id": str(uuid4())}
            with self.server.capture_lock:
                previous = self.server.bet365_capture
                out_of_order = previous is not None and capture["observed_epoch"] < previous["observed_epoch"]
                if not out_of_order:
                    self.server.bet365_capture = capture
            if out_of_order:
                self.respond(409, {"error": "capture_out_of_order"}, error="capture_out_of_order")
                return
            self.capture_id = capture["id"]
            self.respond(200, {"state": "accepted", "capture_id": capture["id"],
                               "received_at": capture["received_at"], "observed_at": capture["observed_at"],
                               "max_age_seconds": self.server.bet365_max_age_seconds})
        finally:
            self.server.capacity.release()

    def do_GET(self):
        if self.path == "/health":
            self.respond(200, {"status": "ok"})
            return
        if not self.authenticated():
            return
        if self.headers.get("Content-Length", "0") != "0" or "Transfer-Encoding" in self.headers:
            self.respond(400, {"error": "request_body_not_supported"}, error="invalid_request")
            return
        self.request_started = time.monotonic()
        try:
            trace = self.headers.get("X-Freebets-Trace-Id")
            self.relay_trace_id = str(UUID(trace)) if trace else None
            url = target_url(self.path, self.server.region, self.server.enable_bet365)
            self.request_book = "bet365" if url == BET365_UPSTREAM else "caesars"
            self.request_kind = "markets" if self.request_book == "bet365" else "schedule" if "/sports/" in urlsplit(url).path else "event"
            if self.request_book == "bet365":
                headers = {name: self.headers[name] for name in ("User-Agent", "Accept", "Cache-Control") if name in self.headers}
                headers["Referer"] = "https://www.mo.bet365.com/"
            else:
                headers = {name: self.headers[name] for name in PUBLIC_HEADERS if name in self.headers}
                UUID(headers.get("X-Unique-Device-Id", ""))
            if any("\r" in value or "\n" in value or len(value) > 512 for value in headers.values()):
                raise ValueError("Invalid public headers")
        except ValueError:
            self.respond(400, {"error": "invalid_caesars_request"}, error="invalid_request")
            return
        if self.request_book == "bet365" and self.server.bet365_source == "browser":
            self.cached_bet365()
            return
        if not self.server.capacity.acquire(blocking=False):
            self.respond(503, {"error": "relay_busy"}, error="relay_busy")
            return
        try:
            try:
                status, body = self.server.fetch(url, headers)
                self.upstream_status = status
            except requests.RequestException:
                self.respond(502, {"error": "upstream_unavailable"}, error="upstream_unavailable")
                return
            except ValueError:
                self.respond(502, {"error": "invalid_upstream_response"}, error="invalid_upstream_response")
                return
            if status != 200:
                self.respond(status if 400 <= status <= 599 else 502,
                             {"error": "upstream_rejected", "status": status}, upstream_status=status)
                return
            self.respond(200, body, content_type="text/plain; charset=utf-8" if self.request_book == "bet365" else "application/json")
        finally:
            self.server.capacity.release()

    def unsupported(self):
        self.respond(405, {"error": "method_not_allowed"}, error="method_not_allowed")

    do_PUT = unsupported
    do_DELETE = unsupported
    do_PATCH = unsupported
    do_CONNECT = unsupported
    do_OPTIONS = unsupported
    do_HEAD = unsupported


def make_server(address, token, region="nj", fetch=fetch_upstream, enable_bet365=False,
                bet365_source="direct", bet365_max_age_seconds=120, capture_clock=time.monotonic):
    if not isinstance(token, str) or not 32 <= len(token) <= 512 or not token.isascii() or any(c.isspace() for c in token):
        raise ValueError("Set relay_token to a random token of at least 32 ASCII characters without whitespace.")
    if not isinstance(region, str) or not re.fullmatch(r"[a-z]{2}", region):
        raise ValueError("Set region to a two-letter lowercase state code.")
    if bet365_source not in {"direct", "browser"}:
        raise ValueError("bet365_source must be direct or browser")
    if type(bet365_max_age_seconds) is not int or not 30 <= bet365_max_age_seconds <= 300:
        raise ValueError("bet365_max_age_seconds must be 30–300")
    server = ThreadingHTTPServer(address, RelayHandler)
    server.daemon_threads = True
    server.relay_token = token
    server.region = region
    server.fetch = fetch
    if not isinstance(enable_bet365, bool):
        server.server_close()
        raise ValueError("enable_bet365 must be a boolean")
    server.enable_bet365 = enable_bet365
    server.bet365_source = bet365_source
    server.bet365_max_age_seconds = bet365_max_age_seconds
    server.bet365_capture = None
    server.capture_lock = threading.Lock()
    server.capture_clock = capture_clock
    server.capacity = threading.BoundedSemaphore(4)
    return server


def main():
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    options_path = Path("/data/options.json")
    options = json.loads(options_path.read_text()) if options_path.exists() else {}
    token = os.getenv("CAESARS_RELAY_TOKEN", options.get("relay_token", ""))
    region = os.getenv("CAESARS_RELAY_REGION", options.get("region", "nj"))
    server = make_server((os.getenv("CAESARS_RELAY_BIND", "0.0.0.0"), PORT), token, region,
                         enable_bet365=options.get("enable_bet365", False),
                         bet365_source=options.get("bet365_source", "browser"),
                         bet365_max_age_seconds=options.get("bet365_max_age_seconds", 120))
    # Supervisor options are read before dropping root inside the container.
    if hasattr(os, "geteuid") and os.geteuid() == 0:
        os.setgroups([])
        os.setgid(65534)
        os.setuid(65534)
    print(f"Caesars relay listening on port {PORT}, region {region}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
