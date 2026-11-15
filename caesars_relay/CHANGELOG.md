# 0.3.0

- Add authenticated browser-capture uploads for MO NBA and an in-memory cache.
- Reject missing, stale, malformed, out-of-order and oversized captures.
- Expose source observation times and age limits to Lambda and the website.
- Retain the existing Caesars paths, region, authentication and port.

# 0.2.0

- Add disabled-by-default `enable_bet365` option for the captured MO NBA feed.
- Add an authenticated `/bet365/nba` route with a fixed upstream URL and query.
- Validate bounded pipe-text responses and log bet365 requests separately.
- Preserve the Caesars routes, authentication, port, region and configuration.

# 0.1.1

- Add safe, timestamped request logs with a shared Lambda/relay trace ID.
- Include Caesars routing, relay trace ID, and request count in scrape status.
- Keep health polls, credentials, response bodies, and client IPs out of request logs.

# 0.1.0

- Read-only NBA, NHL, and MLB Caesars schedule and event relay.
- Shared-token authentication and Cloudflare Access support in the collector.
- Home Assistant OS app with liveness monitoring and 64-bit ARM/x86 builds.
