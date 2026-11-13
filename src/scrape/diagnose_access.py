"""Read-only comparison of public feed access across HTTP clients and hosts."""
import json
import platform
import ssl

import requests
from curl_cffi import requests as curl_requests

from books.caesars.caesars import COMPETITIONS, request_headers
from http_client import FeedClient


def main():
    print(platform.platform(), platform.python_version(), ssl.OPENSSL_VERSION, flush=True)
    for region in ("nj", "mo"):
        client = FeedClient(region)
        probes = {
            "caesars": (
                f"https://api.americanwagering.com/regions/us/locations/{region}/brands/czr/sb/v4/sports/basketball/schedule",
                {"competitionId": COMPETITIONS["nba"][1]},
                request_headers(client),
                "https://sportsbook.caesars.com",
            ),
            "draftkings": (
                f"https://sportsbook-nash.draftkings.com/sites/US-{region.upper()}-SB/api/sportscontent/controldata/league/leagueSubcategory/v1/markets",
                {
                    "isBatchable": "false", "templateVars": "42648",
                    "eventsQuery": "$filter=leagueId eq '42648' AND clientMetadata/Subcategories/any(s: s/Id eq '4511')",
                    "marketsQuery": "$filter=clientMetadata/subCategoryId eq '4511' AND tags/all(t: t ne 'SportcastBetBuilder')",
                    "include": "Events", "entity": "events",
                },
                {}, "https://sportsbook.draftkings.com",
            ),
        }
        for book, (url, params, extra_headers, origin) in probes.items():
            headers = {**client.session.headers, **extra_headers}
            context = {**headers, "Origin": origin, "Referer": origin + "/"}
            browser_headers = {**extra_headers, "Origin": origin, "Referer": origin + "/"}
            variants = {
                "requests": (requests.get, {"headers": headers}),
                "requests-context": (requests.get, {"headers": context}),
                "curl": (curl_requests.get, {"headers": context}),
                "curl-chrome": (curl_requests.get, {"headers": browser_headers, "impersonate": "chrome"}),
            }
            for transport, (get, options) in variants.items():
                result = {"region": region, "book": book, "transport": transport}
                try:
                    response = get(url, params=params, timeout=20, **options)
                    result.update(status=response.status_code, contentType=response.headers.get("content-type"))
                    if "json" in result["contentType"].lower() and response.status_code == 200:
                        payload = response.json()
                        result["shape"] = list(payload)[:8] if isinstance(payload, dict) else len(payload)
                except Exception as error:
                    result["error"] = type(error).__name__
                print(json.dumps(result), flush=True)
        client.close()


if __name__ == "__main__":
    main()
