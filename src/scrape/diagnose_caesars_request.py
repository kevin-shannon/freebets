"""Compare one reproducible anonymous Caesars request without logging secrets."""
import argparse
import hashlib
import importlib.metadata
import json
import platform
import socket
import ssl
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

import requests
from urllib3.util.ssl_ import create_urllib3_context

from books.caesars.caesars import COMPETITIONS, request_headers
from http_client import FeedClient, FeedError


# A dedicated public test identity, never a user's browser/account identity.
DIAGNOSTIC_DEVICE_ID = "b7aca53f-c61e-47e6-9803-16a3269fc188"
RESPONSE_HEADERS = (
    "content-type", "content-length", "server", "via", "x-cache",
    "x-amz-cf-pop", "x-amz-cf-id", "x-amzn-requestid", "x-amz-apigw-id",
    "x-amzn-waf-action", "x-amzn-errortype", "retry-after", "date",
)
BODY_SIGNALS = (
    "the request could not be satisfied", "request blocked", "cloudfront",
    "access denied", "accessdenied", "forbidden", "unauthorized",
    "captcha", "challenge", "awswaf", "geo restriction", "rate limit",
)


def snapshot(region, via_proxy=False):
    client = FeedClient(region)
    # Remove generic environment proxy/netrc settings as uncontrolled variables.
    client.session.trust_env = False
    if via_proxy and not client.caesars_proxy_url:
        raise ValueError("Set CAESARS_PROXY_URL before using --via-proxy.")
    headers = {**request_headers(client), "X-Unique-Device-Id": DIAGNOSTIC_DEVICE_ID}
    url = f"https://api.americanwagering.com/regions/us/locations/{region}/brands/czr/sb/v4/sports/basketball/schedule"
    prepared = client.session.prepare_request(requests.Request(
        "GET", url, params={"competitionId": COMPETITIONS["nba"][1]}, headers=headers,
    ))
    if any(key.lower() in {"authorization", "proxy-authorization", "cookie", "x-aws-waf-token"} for key in prepared.headers):
        raise RuntimeError("Diagnostic request unexpectedly contains credentials; refusing to log it")
    request = {
        "method": prepared.method, "url": prepared.url,
        "headers": dict(prepared.headers), "headerOrder": list(prepared.headers), "body": prepared.body,
    }
    ciphers = [cipher["name"] for cipher in create_urllib3_context().get_ciphers()]
    result = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "environment": {
            "os": platform.platform(), "python": platform.python_version(), "openssl": ssl.OPENSSL_VERSION,
            "route": "caesars-proxy" if via_proxy else "direct",
            "dependencies": {name: importlib.metadata.version(name) for name in (
                "requests", "urllib3", "certifi", "charset-normalizer", "idna",
            )},
            "tlsCiphers": ciphers,
            "destinationAddresses": None if via_proxy else sorted({item[4][0] for item in socket.getaddrinfo(urlsplit(url).hostname, 443, type=socket.SOCK_STREAM)}),
        },
        "request": request,
        "requestSha256": hashlib.sha256(json.dumps(request, sort_keys=True).encode()).hexdigest(),
    }
    try:
        options = client.request_options(url) if via_proxy else {"timeout": (5, 20)}
        response = client.session.send(prepared, allow_redirects=False, **options)
        text = response.text.lower() if response.status_code != 200 else ""
        result["response"] = {
            "status": response.status_code, "elapsedSeconds": round(response.elapsed.total_seconds(), 3),
            "headers": {name: response.headers[name] for name in RESPONSE_HEADERS if name in response.headers},
            "bodyBytes": len(response.content), "bodySha256": hashlib.sha256(response.content).hexdigest(),
            "bodySignals": [signal for signal in BODY_SIGNALS if signal in text],
        }
        if response.status_code == 200 and "json" in response.headers.get("content-type", "").lower():
            payload = response.json()
            result["response"]["jsonShape"] = list(payload) if isinstance(payload, dict) else {"items": len(payload)}
    except requests.RequestException as error:
        result["response"] = {"error": type(error).__name__}
    finally:
        client.close()
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--region", choices=("nj", "mo"), default="nj")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--via-proxy", action="store_true", help="Use CAESARS_PROXY_URL; the default comparison stays direct")
    args = parser.parse_args()
    try:
        result = snapshot(args.region, via_proxy=args.via_proxy)
    except (ValueError, FeedError) as error:
        parser.error(str(error))
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print("CAESARS_REQUEST_SNAPSHOT " + json.dumps(result), flush=True)
