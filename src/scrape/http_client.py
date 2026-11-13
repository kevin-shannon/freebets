"""Bounded public-feed requests with actionable failures and no account login."""
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

    def get_json(self, url, *, params=None, headers=None):
        session = self.session
        if urlsplit(url).hostname == "sportsbook-nash.draftkings.com":
            # Cloud hosts need a browser-compatible TLS/HTTP connection as well
            # as public headers. Keep that transport scoped to DraftKings.
            if self.browser_session is None:
                self.browser_session = browser_requests.Session(impersonate="chrome", headers={
                    "Origin": "https://sportsbook.draftkings.com",
                    "Referer": "https://sportsbook.draftkings.com/",
                })
            session = self.browser_session
        try:
            response = session.get(url, params=params, headers=headers, timeout=(5, 20))
        except (requests.RequestException, browser_requests.RequestsError) as error:
            raise FeedError(f"Request failed: {url}: {type(error).__name__}") from error
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
