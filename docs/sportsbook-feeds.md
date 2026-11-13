# Sportsbook feed investigation

Verified from this machine on November 12–13, 2026. These are observed results, not
guarantees that private website APIs will remain available. All active adapters
now use the same state, New Jersey by default.

| Original integration | Observed failure | Change and current result |
| --- | --- | --- |
| BetMGM | DC widget route returns 403; old hardcoded CDS access ID and `games/results` schema are obsolete for current NBA games. | Read the public sports client configuration for the current CDS host and access ID. Parse `optionMarkets/options/price` as well as legacy games. Live NBA and NHL odds verified. |
| FanDuel | API still returns JSON. NHL competition is now `NHL`; main totals and handicaps use new labels and numeric runner handicaps. | Updated competition matching and full-game market parsing. Live NBA and NHL odds verified. |
| DraftKings | Abbreviated `User-Agent: Mozilla/5.0` caused HTTP 403 on both the control-data and Stadium routes. | A complete browser User-Agent restores automated requests without cookies. Verified NBA: nine games / 27 markets. Verified NHL: two games / 30 markets. MLB returns offseason futures, which are excluded without treating the feed as broken. |
| Caesars | Requests omitted the public platform metadata and device ID, causing HTTP 403. The original adapter also mixed Michigan schedules with Illinois details. | Add the public web-client headers and a generated UUID reused for that collection. v4 schedules and event details now work without bearer or WAF tokens. Verified NBA: nine games / 27 markets; NHL: four games / eight markets. |

The first complete run recovered 11 BetMGM games and 11 FanDuel games across NBA
and NHL. MLB returned valid empty schedules. BetMGM and FanDuel can therefore be
compared locally while the other active integrations report their access failures.
Counts and prices change; use `scrape-status.json` for the latest result.

After both header fixes, all four active sportsbooks passed the same live check
in New Jersey with 374 normalized markets and no incomplete-coverage state.
Caesars was also verified separately in Missouri. This result uses live network
responses, not replayed browser captures.

Production uses AWS Lambda, so local success alone is insufficient. On November
13, both Lambda and GitHub's hosted Windows/Linux runners returned HTTP 403 for
Caesars and DraftKings with `requests`, including after upgrading Lambda from
Python 3.9 to 3.13. Dependency versions and the runtime upgrade did not resolve
those access failures. DraftKings returned valid NBA JSON on both cloud runners
with `curl_cffi`'s Chrome-compatible TLS/HTTP transport. The collector now scopes
that transport to DraftKings, while the other books continue using `requests`.
Caesars still requires separate production access investigation. The deployment
workflow invokes the collector and rejects incomplete coverage after upload;
`scrape-status.json` records the actual per-book result.

## Verified source routes

- BetMGM configuration: `https://www.nj.betmgm.com/en/api/clientconfig`, with the
  public client header `x-bwin-sports-api: prod`. `msConnection.cdsApiUrl` currently
  points to `https://cf-us1-cds-api.itsfogo.com`. Fixture requests use
  `/bettingoffer/fixtures` and the config's `pushAccessId`. No access ID is stored
  in the source code.
- FanDuel: `https://sbapi.nj.sportsbook.fanduel.com/api/content-managed-page`,
  using `page=CUSTOM`, `customPageId=nba|nhl|mlb`, and the existing public `_ak`.
- DraftKings: `https://sportsbook-nash.draftkings.com/api/sportscontent/dkusnj/v1/leagues/{leagueId}`
  and `/categories/{categoryId}` for NHL/MLB. On November 13, the user's browser
  capture identified the NBA route
  `/sites/US-MO-SB/api/sportscontent/controldata/league/leagueSubcategory/v1/markets`
  with `templateVars=42648`, OData filters selecting subcategory `4511` and
  excluding `SportcastBetBuilder`, `include=Events`, and `entity=events`.
  The saved public NBA CMS template contains the exact same query parameters.
  Initial MO and NJ requests returned 403 with an abbreviated User-Agent. The adapter
  builds this route using the configured state and lets `requests` encode the
  filters once. It does not apply NBA's subcategory ID to other leagues.
  The user subsequently supplied a successful response containing nine events,
  27 markets, and 54 selections. That capture validates the shared array schema
  and yields nine games and 27 two-way NBA markets, including correct aggregation
  with recorded BetMGM quotes. A subsequent header comparison established that
  a complete browser User-Agent is sufficient to recover real HTTP 200 JSON
  responses on the same route and filters. This was verified without browser
  cookies, login, page preloading, extra SDK headers, or a different HTTP library.
  Both regular query encoding (`+` spaces) and `%20` encoding work with the full
  agent. Live NBA control-data requests and NHL Stadium/category requests now
  pass; the stored browser capture remains a regression fixture.
  Seven-digit fractional timestamps are normalized
  to microseconds for compatibility with older local Python 3.9 parsers, whose supported
  fractional formats are documented in
  [Python's datetime reference](https://docs.python.org/3.9/library/datetime.html#datetime.datetime.fromisoformat).
  Non-pregame statuses are excluded, and invalid event starts now produce a
  warning instead of silently disappearing. Strict validation still reports a
  schema mismatch rather than accepting it as an empty schedule.
  The control-data capture and Stadium public client both use
  `event.startEventDate`, `market.eventId`, `selection.marketId`,
  `selection.displayOdds.american`, and `selection.points` into the older UI model.
- Caesars: `https://api.americanwagering.com/regions/us/locations/nj/brands/czr/sb/v4/sports/{sport}/schedule?competitionId={id}`
  and `/v4/events/{eventId}?useEventPayloadWithTabNav=true`. Its public DTO schemas
  define schedules as arrays, and event details as `{event: {keyMarketGroups}}`.
  The user's Missouri `/v3/sports-menu` capture confirmed the NBA/NHL/MLB
  competition IDs already configured in the adapter. That endpoint is navigation:
  its zero event counts and empty event arrays do not mean the odds feeds are empty.
  Tests isolated the required public request context: `Content-Type:
  application/json`, `X-Platform-Type: W`, `X-Platform: rn-web`,
  `X-App-Version: 10.7.7`, and `X-Unique-Device-Id` containing a newly generated UUID.
  A device ID alone was insufficient, as were platform headers without a device
  ID. Together they return HTTP 200 for both schedules and event details.
  The adapter generates its own ID and reuses it across sports and details in
  one collection. These headers are scoped to Caesars requests. The collector
  does not require or store an account bearer token, browser WAF token, or the
  user's original device ID.

Entry pages used to find these routes:
[BetMGM NBA](https://www.nj.betmgm.com/en/sports/basketball-7/betting/usa-9/nba-6004),
[DraftKings NBA](https://sportsbook.draftkings.com/leagues/basketball/nba), and
[Caesars basketball](https://sportsbook.caesars.com/us/il/bet/basketball).
The initial probes also checked ordinary SDK headers, but retained the abbreviated
User-Agent, so those results did not isolate the eventual cause. A later direct
comparison found that the full User-Agent alone restores DraftKings. The shared
HTTP client now sends that complete value. Caesars initially still returned 403
with its platform/version headers because the device ID was missing. The user's
subsequent browser headers exposed that difference; adding a generated ID and
the platform metadata restored Caesars in NJ and MO without personal tokens.
Earlier isolated headless-browser checks also
received Access Denied on DraftKings and "MARKETS NOT AVAILABLE" on Caesars.
Those browser results no longer describe the fixed Python collectors.
Replayed captures are never marked as fresh live quotes.

## Matching and reliability

- Require two distinct, priced outcomes with complementary spread lines or equal
  total lines. Skip suspended selections, live games, props, futures, and
  regulation-only markets rather than mixing them with full-game odds.
- Normalize numeric lines, even-money prices, Unicode minus signs, and Utah's NHL
  name. Stable zero-spread keys match regardless of selection order.
- Match identical teams and sports within ten minutes. The verified NHL responses
  differ by eight minutes (broadcast time versus puck drop). Widely separated
  doubleheaders stay separate. Unknown start times are excluded.
- Bound network requests with connection/read timeouts; distinguish denied
  requests, HTML redirects, invalid schemas, and genuine empty schedules. One
  book's failure does not discard another book's output.
- Importing the Lambda module performs no requests. Every invocation fetches
  again. Local writes are atomic. Total failures preserve the old odds file;
  the app displays the failure rather than presenting it as fresh data.
- The previous S3 `output.json` contained 27 rows dated May 6, 2024. Development
  now reads local files. The banner shows freshness and incomplete coverage;
  production data still requires deployment of the new collector.

## Regression fixtures

`src/scrape/tests/fixtures` contains small field-preserving subsets of real
BetMGM, FanDuel, and Caesars responses collected during this investigation.
The Caesars NBA/NHL subsets preserve actual prices, home/away selection types,
slider duplicates, inactive flags, and period/prop examples. Tests verify that
headers reuse one generated ID, contain no session credentials, and do not leak
into requests to other books.
`draftkings-control-nba.json` retains the nine events, 27 markets, and 54
selections from the user's response, trimming unused metadata while preserving
the original IDs, team names, seven-digit start timestamps, Unicode prices,
lines, statuses, and relevant market/selection tags. Tests also construct edge
cases and DTO examples from public JavaScript schemas. Fixture
validation alone does **not** establish successful automated live access. The
separate live checks now establish DraftKings and Caesars NBA/NHL access.
These stored quotes are never published as fresh data.
