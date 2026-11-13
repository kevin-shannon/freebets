"""Bounded public-feed requests with actionable failures and no account login."""
import os
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

    def relay_response(self, url, params, headers):
        try:
            relay = urlsplit(self.caesars_relay_url)
            loopback = relay.hostname in {"localhost", "127.0.0.1", "::1"}
            if not (
                (relay.scheme == "https" or (relay.scheme == "http" and loopback))
                and relay.hostname and relay.hostname != "api.americanwagering.com"
                and relay.port != 0 and relay.path in {"", "/"}
                and relay.username is None and relay.password is None and not relay.query and not relay.fragment
            ):
                raise ValueError("Invalid relay origin")
        except ValueError:
            raise FeedError("CAESARS_RELAY_URL must be an HTTPS origin (HTTP is allowed only on loopback for testing).") from None
        if not 32 <= len(self.caesars_relay_token) <= 512 or not self.caesars_relay_token.isascii() or any(c.isspace() for c in self.caesars_relay_token):
            raise FeedError("Set CAESARS_RELAY_TOKEN to the relay's random token of at least 32 characters.")
        if bool(self.caesars_access_id) != bool(self.caesars_access_secret):
            raise FeedError("Set both CAESARS_RELAY_ACCESS_CLIENT_ID and CAESARS_RELAY_ACCESS_CLIENT_SECRET.")
        source = urlsplit(url)
        target = relay._replace(path=source.path, query=source.query).geturl()
        relay_headers = {**(headers or {}), "Authorization": "Bearer " + self.caesars_relay_token}
        if self.caesars_access_id:
            relay_headers.update({
                "CF-Access-Client-Id": self.caesars_access_id,
                "CF-Access-Client-Secret": self.caesars_access_secret,
            })
        # Credentials belong only to this configured origin, including on redirects.
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
        session = self.session
        hostname = urlsplit(url).hostname
        via_relay = hostname == "api.americanwagering.com" and bool(self.caesars_relay_url)
        if via_relay and self.caesars_relay_failure:
            raise FeedError(self.caesars_relay_failure)
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
                response = self.relay_response(url, params, headers)
            else:
                response = session.get(url, params=params, headers=headers, **self.request_options(url))
        except (requests.RequestException, browser_requests.RequestsError) as error:
            message = (f"Caesars home relay request failed ({type(error).__name__}); check tunnel and relay availability."
                       if via_relay else f"Request failed: {url}: {type(error).__name__}")
            if via_relay:
                self.caesars_relay_failure = message
            raise FeedError(message) from error
        if via_relay:
            if 300 <= response.status_code < 400:
                self.caesars_relay_failure = "Caesars home relay redirected the request; check its Cloudflare Access Service Auth policy."
                raise FeedError(self.caesars_relay_failure)
            if not response.ok and not response.headers.get("X-Freebets-Upstream-Status"):
                message = f"Caesars home relay HTTP {response.status_code}; check relay availability, state, token, and Cloudflare Access configuration."
                if response.status_code in {401, 403} or (response.status_code >= 500 and response.headers.get("X-Freebets-Relay-Error") != "invalid_upstream_response"):
                    self.caesars_relay_failure = message
                raise FeedError(message)
        if response.status_code in (401, 403, 451):
            raise FeedError(f"HTTP {response.status_code}: public feed access denied at {url}", "blocked")
        if not response.ok:
            raise FeedError(f"HTTP {response.status_code} from {url}")
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
