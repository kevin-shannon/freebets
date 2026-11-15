"""Bounded public-feed requests with actionable failures and no account login."""
import os
import json
import time
import uuid
from urllib.parse import urlsplit

import requests
from curl_cffi import requests as browser_requests


# DraftKings rejects the abbreviated "Mozilla/5.0" agent with HTTP 403 while
# accepting this complete browser agent on the same public URL, without cookies.
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36"
)


class FeedError(Exception):
    def __init__(self, message, state="error"):
        super().__init__(message)
        self.state = state


class FeedClient:
    def __init__(self, region="nj"):
        if len(region) != 2 or not region.isascii() or not region.isalpha():
            raise ValueError("Region must be a two-letter state code")
        self.region = region.lower()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "application/json",
            "Cache-Control": "no-cache",
        })
        self.cache = {}
        self.warnings = []
        self.browser_session = None
        self.caesars_proxy_url = os.getenv("CAESARS_PROXY_URL", "").strip()
        self.caesars_relay_url = os.getenv("CAESARS_RELAY_URL", "").strip()
        self.caesars_relay_token = os.getenv("CAESARS_RELAY_TOKEN", "").strip()
        self.caesars_access_id = os.getenv("CAESARS_RELAY_ACCESS_CLIENT_ID", "").strip()
        self.caesars_access_secret = os.getenv("CAESARS_RELAY_ACCESS_CLIENT_SECRET", "").strip()
        self.caesars_relay_failure = None
        self.caesars_relay_trace_id = str(uuid.uuid4())
        self.caesars_relay_requests = 0
        self.bet365_relay_url = os.getenv("BET365_RELAY_URL", "").strip()
        # A shared relay origin can use the existing token and Access policy.
        self.bet365_relay_token = os.getenv("BET365_RELAY_TOKEN", self.caesars_relay_token).strip()
        self.bet365_access_id = os.getenv("BET365_RELAY_ACCESS_CLIENT_ID", self.caesars_access_id).strip()
        self.bet365_access_secret = os.getenv("BET365_RELAY_ACCESS_CLIENT_SECRET", self.caesars_access_secret).strip()
        self.bet365_relay_failure = None
        self.bet365_relay_trace_id = str(uuid.uuid4())
        self.bet365_relay_requests = 0
        self.bet365_region = os.getenv("BET365_REGION", self.region).strip().lower()
        self.bet365_capture = None

    def relay_response(self, url, params, headers, book="caesars"):
        relay_url = getattr(self, f"{book}_relay_url")
        token = getattr(self, f"{book}_relay_token")
        access_id = getattr(self, f"{book}_access_id")
        access_secret = getattr(self, f"{book}_access_secret")
        prefix = book.upper()
        try:
            relay = urlsplit(relay_url)
            loopback = relay.hostname in {"localhost", "127.0.0.1", "::1"}
            if not (
                (relay.scheme == "https" or (relay.scheme == "http" and loopback))
                and relay.hostname and relay.hostname not in {"api.americanwagering.com", "www.mo.bet365.com"}
                and relay.port != 0 and relay.path in {"", "/"}
                and relay.username is None and relay.password is None and not relay.query and not relay.fragment
            ):
                raise ValueError("Invalid relay origin")
        except ValueError:
            raise FeedError(f"{prefix}_RELAY_URL must be an HTTPS origin (HTTP is allowed only on loopback for testing).") from None
        if not 32 <= len(token) <= 512 or not token.isascii() or any(c.isspace() for c in token):
            raise FeedError(f"Set {prefix}_RELAY_TOKEN to the relay's random token of at least 32 characters.")
        if bool(access_id) != bool(access_secret):
            raise FeedError(f"Set both {prefix}_RELAY_ACCESS_CLIENT_ID and {prefix}_RELAY_ACCESS_CLIENT_SECRET.")
        source = urlsplit(url)
        target = relay._replace(path=source.path, query=source.query).geturl()
        if book == "bet365":
            target = relay._replace(path="/bet365/nba", query="").geturl()
            params = None  # The relay constructs the one allowed upstream query.
        relay_headers = {
            **(headers or {}), "Authorization": "Bearer " + token,
            "X-Freebets-Trace-Id": getattr(self, f"{book}_relay_trace_id"),
        }
        if access_id:
            relay_headers.update({
                "CF-Access-Client-Id": access_id,
                "CF-Access-Client-Secret": access_secret,
            })
        # Credentials belong only to this configured origin, including on redirects.
        setattr(self, f"{book}_relay_requests", getattr(self, f"{book}_relay_requests") + 1)
        return self.session.get(target, params=params, headers=relay_headers,
                                timeout=(5, 20), allow_redirects=False)

    def request_options(self, url):
        options = {"timeout": (5, 20)}
        if urlsplit(url).hostname == "api.americanwagering.com" and self.caesars_proxy_url:
            try:
                proxy = urlsplit(self.caesars_proxy_url)
                valid = (
                    proxy.scheme in {"http", "https"} and proxy.hostname and proxy.port != 0
                    and proxy.path in {"", "/"} and not proxy.query and not proxy.fragment
                )
                if not valid:
                    raise ValueError("Invalid proxy")
            except ValueError:
                # Malformed URLs can contain passwords; never include them in errors.
                raise FeedError("CAESARS_PROXY_URL must be an http:// or https:// forward-proxy URL.") from None
            options["proxies"] = {"http": self.caesars_proxy_url, "https": self.caesars_proxy_url}
        return options

    def get_json(self, url, *, params=None, headers=None):
        return self._timed_request(url, self._get_json, params=params, headers=headers)

    def get_text(self, url, *, params=None, headers=None):
        return self._timed_request(url, self._get_text, params=params, headers=headers)

    def _timed_request(self, url, operation, *, params=None, headers=None):
        started = time.monotonic()
        target = urlsplit(url)
        # Do not log query strings, request headers, or relay credentials.
        request = {"event": "feed_request", "host": target.hostname, "path": target.path}
        print(json.dumps({**request, "phase": "start"}), flush=True)
        try:
            result = operation(url, params=params, headers=headers)
        except Exception as error:
            print(json.dumps({**request, "phase": "error", "error_type": type(error).__name__,
                              "duration_ms": round((time.monotonic() - started) * 1000)}), flush=True)
            raise
        print(json.dumps({**request, "phase": "complete",
                          "duration_ms": round((time.monotonic() - started) * 1000)}), flush=True)
        return result

    def _get_response(self, url, *, params=None, headers=None):
        session = self.session
        hostname = urlsplit(url).hostname
        relay_book = "bet365" if hostname == "www.mo.bet365.com" and self.bet365_relay_url else "caesars"
        via_relay = (hostname == "api.americanwagering.com" and bool(self.caesars_relay_url)) or (relay_book == "bet365")
        relay_label = "bet365" if relay_book == "bet365" else "Caesars"
        failure_attribute = f"{relay_book}_relay_failure"
        if via_relay and getattr(self, failure_attribute):
            raise FeedError(getattr(self, failure_attribute))
        if hostname == "sportsbook-nash.draftkings.com":
            # Cloud hosts need a browser-compatible TLS/HTTP connection as well
            # as public headers. Keep that transport scoped to DraftKings.
            if self.browser_session is None:
                self.browser_session = browser_requests.Session(impersonate="chrome", headers={
                    "Origin": "https://sportsbook.draftkings.com",
                    "Referer": "https://sportsbook.draftkings.com/",
                })
            session = self.browser_session
        try:
            if via_relay:
                response = self.relay_response(url, params, headers, book=relay_book)
            else:
                response = session.get(url, params=params, headers=headers, **self.request_options(url))
        except (requests.RequestException, browser_requests.RequestsError) as error:
            message = (f"{relay_label} home relay request failed ({type(error).__name__}); check tunnel and relay availability."
                       if via_relay else f"Request failed: {url}: {type(error).__name__}")
            if via_relay:
                setattr(self, failure_attribute, message)
            raise FeedError(message) from error
        if via_relay:
            if relay_book == "bet365" and response.headers.get("X-Freebets-Relay-Error") in {"capture_missing", "capture_stale"}:
                state = "stale" if response.headers["X-Freebets-Relay-Error"] == "capture_stale" else "unavailable"
                message = f"bet365 browser capture is {state}; keep the configured browser publisher running."
                setattr(self, failure_attribute, message)
                raise FeedError(message, state)
            if 300 <= response.status_code < 400:
                message = f"{relay_label} home relay redirected the request; check its Cloudflare Access Service Auth policy."
                setattr(self, failure_attribute, message)
                raise FeedError(message)
            if not response.ok and not response.headers.get("X-Freebets-Upstream-Status"):
                message = f"{relay_label} home relay HTTP {response.status_code}; check relay availability, state, token, and Cloudflare Access configuration."
                if response.status_code in {401, 403} or (response.status_code >= 500 and response.headers.get("X-Freebets-Relay-Error") != "invalid_upstream_response"):
                    setattr(self, failure_attribute, message)
                raise FeedError(message)
        if response.status_code in (401, 403, 451):
            raise FeedError(f"HTTP {response.status_code}: public feed access denied at {url}", "blocked")
        if not response.ok:
            raise FeedError(f"HTTP {response.status_code} from {url}")
        if via_relay and relay_book == "bet365" and response.headers.get("X-Freebets-Capture-Received-At"):
            try:
                age = float(response.headers["X-Freebets-Capture-Age-Seconds"])
                max_age = int(response.headers["X-Freebets-Capture-Max-Age-Seconds"])
                if not 0 <= age < max_age <= 300:
                    raise ValueError("Invalid capture age")
                self.bet365_capture = {"source": "browser_capture", "captureReceivedAt": response.headers["X-Freebets-Capture-Received-At"],
                                       "captureObservedAt": response.headers["X-Freebets-Capture-Observed-At"],
                                       "captureAgeSeconds": age, "captureMaxAgeSeconds": max_age,
                                       "captureId": response.headers["X-Freebets-Capture-Id"]}
            except (KeyError, ValueError):
                raise FeedError("bet365 relay supplied invalid capture freshness metadata", "stale") from None
        return response

    def _get_text(self, url, *, params=None, headers=None):
        response = self._get_response(url, params=params, headers=headers)
        if "html" in response.headers.get("Content-Type", "").lower():
            raise FeedError(f"Expected feed text; received HTML at {url}", "unexpected_response")
        return response.text

    def _get_json(self, url, *, params=None, headers=None):
        response = self._get_response(url, params=params, headers=headers)
        # Old feeds now redirect to unrelated landing pages. A 200 is not success.
        if "json" not in response.headers.get("Content-Type", "").lower():
            raise FeedError(f"Expected JSON; received a page at {response.url}", "unexpected_response")
        try:
            return response.json()
        except ValueError as error:
            raise FeedError(f"Invalid JSON from {url}", "unexpected_response") from error

    def cached_json(self, key, url, **kwargs):
        if key not in self.cache:
            self.cache[key] = self.get_json(url, **kwargs)
        return self.cache[key]

    def warn(self, message):
        if message not in self.warnings:
            self.warnings.append(message)

    def close(self):
        self.session.close()
        if self.browser_session is not None:
            self.browser_session.close()
