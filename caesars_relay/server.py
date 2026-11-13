"""Authenticated, read-only Caesars relay for a Home Assistant app container."""
import hmac
import json
import os
import re
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from uuid import UUID

import requests

UPSTREAM = "https://api.americanwagering.com"
PORT = 8787
MAX_RESPONSE_BYTES = 8 * 1024 * 1024
PUBLIC_HEADERS = (
    "User-Agent", "Accept", "Cache-Control", "Content-Type", "X-Platform-Type",
    "X-Platform", "X-App-Version", "X-Unique-Device-Id",
)


def target_url(path, region):
    parsed = urlsplit(path)
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
            if "json" not in response.headers.get("Content-Type", "").lower():
                raise ValueError("Upstream did not return JSON")
            body = bytearray()
            for chunk in response.iter_content(65536):
                body.extend(chunk)
                if len(body) > MAX_RESPONSE_BYTES:
                    raise ValueError("Upstream response too large")
            json.loads(body)
            return 200, bytes(body)


class RelayHandler(BaseHTTPRequestHandler):
    server_version = "FreebetsRelay/0.1"
    sys_version = ""

    def log_message(self, format, *args):
        # Never log incoming headers, credentials, or upstream response bodies.
        pass

    def respond(self, status, body, *, error=None, upstream_status=None):
        if not isinstance(body, bytes):
            body = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        if error:
            self.send_header("X-Freebets-Relay-Error", error)
        if upstream_status is not None:
            self.send_header("X-Freebets-Upstream-Status", str(upstream_status))
        self.end_headers()
        self.close_connection = True
        try:
            if self.command != "HEAD":
                self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        if self.path == "/health":
            self.respond(200, {"status": "ok"})
            return
        expected = ("Bearer " + self.server.relay_token).encode("utf-8")
        if not hmac.compare_digest(self.headers.get("Authorization", "").encode("utf-8"), expected):
            self.respond(401, {"error": "unauthorized"}, error="unauthorized")
            return
        if self.headers.get("Content-Length", "0") != "0" or "Transfer-Encoding" in self.headers:
            self.respond(400, {"error": "request_body_not_supported"}, error="invalid_request")
            return
        try:
            url = target_url(self.path, self.server.region)
            headers = {name: self.headers[name] for name in PUBLIC_HEADERS if name in self.headers}
            UUID(headers.get("X-Unique-Device-Id", ""))
            if any("\r" in value or "\n" in value or len(value) > 512 for value in headers.values()):
                raise ValueError("Invalid public headers")
        except ValueError:
            self.respond(400, {"error": "invalid_caesars_request"}, error="invalid_request")
            return
        if not self.server.capacity.acquire(blocking=False):
            self.respond(503, {"error": "relay_busy"}, error="relay_busy")
            return
        try:
            try:
                status, body = self.server.fetch(url, headers)
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
            self.respond(200, body)
        finally:
            self.server.capacity.release()

    def unsupported(self):
        self.respond(405, {"error": "method_not_allowed"}, error="method_not_allowed")

    do_POST = unsupported
    do_PUT = unsupported
    do_DELETE = unsupported
    do_PATCH = unsupported
    do_CONNECT = unsupported
    do_OPTIONS = unsupported
    do_HEAD = unsupported


def make_server(address, token, region="nj", fetch=fetch_upstream):
    if not isinstance(token, str) or not 32 <= len(token) <= 512 or not token.isascii() or any(c.isspace() for c in token):
        raise ValueError("Set relay_token to a random token of at least 32 ASCII characters without whitespace.")
    if not isinstance(region, str) or not re.fullmatch(r"[a-z]{2}", region):
        raise ValueError("Set region to a two-letter lowercase state code.")
    server = ThreadingHTTPServer(address, RelayHandler)
    server.daemon_threads = True
    server.relay_token = token
    server.region = region
    server.fetch = fetch
    server.capacity = threading.BoundedSemaphore(4)
    return server


def main():
    options_path = Path("/data/options.json")
    options = json.loads(options_path.read_text()) if options_path.exists() else {}
    token = os.getenv("CAESARS_RELAY_TOKEN", options.get("relay_token", ""))
    region = os.getenv("CAESARS_RELAY_REGION", options.get("region", "nj"))
    server = make_server((os.getenv("CAESARS_RELAY_BIND", "0.0.0.0"), PORT), token, region)
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
