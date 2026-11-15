# Adding an odds feed

Availability and collected odds are separate. An icon or state listing does not
mean an operator has a connected feed.

## Adapter contract

1. Capture the actual public website request and a small sanitized response for
   each supported league. Do not commit cookies, account credentials, bearer
   tokens, device identifiers, or signed URLs. A third-party provider's API is a
   separate integration; it must not be mistaken for an operator endpoint.
2. Put the adapter at `src/scrape/books/<id>/<id>.py`. Export
   `fetch_sport(sport, client)` and keep response parsing in a separate function
   so recorded responses can be tested without network access.
3. Use `client.get_json` for JSON requests, including any shared transport
   requirements. This preserves timeouts, timing logs and request failure
   reporting. A non-JSON feed needs a reviewed transport/parser extension;
   do not force it through JSON or guess its fields.
4. Return the existing nested event/start/offers structure using
   `markets.event_info` and `markets.add_market`. Only include supported full-game
   pregame two-way markets. Distinguish a blocked request or changed schema from
   a valid empty schedule. Never substitute another book's odds.
5. Save sanitized payloads in `src/scrape/tests/fixtures` and test participant
   order, start times, moneyline, spread signs, total lines, suspended/live
   exclusions, malformed payloads and failure isolation.
6. During development, add the ID to `EXPERIMENTAL_BOOKS` in
   `src/scrape/books/registry.py`. This makes it available to an explicit
   `--books <id>` check without adding it to default local or Lambda runs.
   Once live access and coverage are verified, move the ID to `CONNECTED_BOOKS` in
   `src/scrape/books/registry.py`. Both CLI choices and Lambda collection use
   this registry; no import or dispatch changes in `main.py` are needed.
7. Set `hasOdds: true` in `src/data/sportsbooks.ts`. Comparison choices are
   derived from that catalog and restricted by existing state availability.
   For a brand outside the current ten, also add its enum ID, icon and verified
   availability record.
8. Run the recorded adapter tests, a targeted live check, frontend tests and
   TypeScript checks. Verify the deployed Lambda feed before considering the
   book connected. Local access does not establish cloud access.

Example checks after an adapter is implemented and registered:

```sh
python -m unittest discover -s src/scrape/tests -v
npm run scrape:check -- --books bet365 --sports nba --region mo
npm test -- --watchAll=false --runInBand
npx tsc --noEmit
```

## bet365 investigation

The user supplied a first-party MO NBA request and complete pipe response:

```text
https://www.mo.bet365.com/contentdata/matchmarketscontentapi/markets
lid=32
zid=0
pd=#AC#B18#C20604387#D48#E1453#F10#
cid=198
cgid=3
ctid=198
```

`pd` must be passed through request parameters so `#` becomes `%23`; a pasted
URL with literal hashes starts a fragment, truncating the HTTP query.

The experimental NBA adapter supports the captured full-game Spread, Total and
Money columns. It joins selections by `OI` (which differs from `FI` for totals
and moneylines), converts fractional `OD` prices to American odds and rejects
incomplete/suspended pairs. Spread selection order is checked against the
event's `PC` selection ID. Moneyline pairs follow the captured away/home display
order; a changed layout requires revalidation. `BC` is interpreted as UTC for
this `zid=0` capture: all six supplied event starts agree with a live BetMGM
schedule within ten minutes. The recorded fixture is trimmed to two complete
games, with navigation, visual metadata and stats links removed.

Regular HTTP and Chrome-compatible transport both returned Cloudflare HTTP 403
for the correctly encoded endpoint on MO and NJ hosts on November 15, 2026 UTC.
Thus bet365 remains outside scheduled collection and frontend comparison choices.
The explicit MO NBA check is available now; it reports a blocked feed rather
than an empty schedule. No NBA success is claimed from live collection.

The user confirmed the NBA page also works logged out in a private browser.
That rules out an account requirement but does not rule out anonymous browser
cookies or challenges. Version 0.2.0 of the home relay now includes an opt-in,
authenticated `/bet365/nba` test using a fixed upstream URL. Setting
`BET365_RELAY_URL` routes only the experimental MO request through that endpoint;
credentials default to the existing Caesars relay credentials. This has passed
local HTTP integration tests, not a real home-network bet365 collection. See
[the relay test instructions](../caesars_relay/DOCS.md#optional-bet365-nba-access-test-020).

Next steps are to establish reliable live feed access without account/browser
credentials and capture the NHL/MLB routes and responses. Other states and
leagues return `unsupported`; their identifiers are not inferred from NBA.

### Browser request investigation, November 15, 2026

Controlled checks in the user's working browser returned HTTP 200 with an empty
body for manually issued fetches, both with cookies omitted and with cookies
included. An unchanged resend of the site's own request returned approximately
13 KB; removing only `X-Net-Sync-Term` made that resend return an empty body.
These observations establish a header requirement for that captured request,
not a reusable token lifetime or a complete explanation of the separate direct
HTTP 403.

The supplied DataLibX bundle publishes the request URL/body, obtains a token
through `xcftr`/`xcft<instance>` events, then adds the header before sending XHR.
The desktop response reader simply returns response text; native mobile
attestation is a separate branch. The bundle contains the event requester but
not the matching handler.

The saved page HTML identifies a separate dynamically loaded script:
`/blob/js/www-US-sportsus/cwc/749/cwc.js`. This public script downloaded with
HTTP 200. Inspection shows an obfuscated interpreter and an encoded program.
Executing it in a fresh, isolated Chrome context with all network requests
blocked registered an `xcftr` listener, plus mouse/touch event listeners. This
locates the missing component and explains why literal text searches did not
find the listener in DataLibX. It does not establish the token-generation rules,
request/session binding, or an unattended collection method. Script versions
must be discovered from the current bootstrap rather than hardcoded as stable.

A plain home HTTP relay does not supply this browser-side token mechanism; the
prepared relay option remains disabled by default and need not be deployed for
this investigation. Do not hardcode captured header/cookie values or promote
bet365 to connected status on the strength of a parser test. A browser-based
collection experiment would need to observe the actual site's own successful
public responses and prove reliable operation before any production changes.

The optional [local browser observer](../tools/bet365-browser/README.md) now
implements that experiment. Its mocked-browser integration tests successfully
capture and normalize the recorded feed and reject empty/challenged responses.
The real headless Chrome run returned HTTP 403 on the initial document before
any feed loaded. Visible fresh Chrome runs instead returned document HTTP 200,
completed 77 HTTP requests with nonempty bootstrap data and no reported HTTP
failures or uncaught page errors, but remained on the preloader without an odds
request. The diagnostics now include progress, bootstrap sizes and socket frame
counts (without payloads). This startup stall is unresolved; ordinary Chrome
outside automation must be compared with the working Firefox session.

The user confirmed ordinary Chrome loads odds; the keep-open automated session
still did not. A supported automated Firefox 159 build reproduced the same
startup stall (55 completed HTTP responses and no odds request). No browser
identity/detection settings were modified. An optional
[DevTools capture panel](../tools/bet365-devtools/README.md) now observes only the
verified public response in the user's existing normal Chrome session. Its
capture/validation checks pass locally. The user subsequently supplied a real
17,348-byte DevTools capture from normal Chrome on November 15: the parser
validated 8 NBA events and 24 markets (8 each of moneyline, spread and total)
with zero warnings. The normalized result is in ignored
`.local/bet365-manual/output.json`. Manual collection is now verified; automated
browser and scheduled collection remain unverified. This does not make bet365
connected to the live website.

The manual capture is not a completion criterion for the sportsbook integration.
The remaining requirement is fresh, repeatable delivery into the scheduled
collector with explicit stale/outage handling. Replaying the captured file as
live quotes or enabling the frontend flag would not satisfy that requirement.

A subsequent minimal visible Chrome run, with no network/console listeners,
request manipulation, or odds observer, also stayed on the preloader. Its final
read-only DOM check found no team names or market labels. This rules out this
tool's response observation as the sole cause; it does not establish the site's
exact automation/session-validation mechanism.

### Self-hosted publisher implementation

The user selected the free, self-hosted path. The normal-browser DevTools
extension now reloads the MO NBA tab every 60 seconds, observes its own fresh
response, and POSTs it to an authenticated home-relay cache. Only the relay's
configured origin receives permission and credentials; sportsbook cookies and
token headers are not forwarded. Stored relay credentials are opt-in and local
to the extension. Closing the browser/DevTools or sleeping the machine stops
updates; Home Assistant OS itself is not running this browser.

The receiver validates capture age/layout, rejects malformed/older uploads,
and expires quotes after its configured TTL (default 120 seconds). The backend
can opt in with `BET365_ENABLED=true`, `BET365_REGION=mo`, and `BET365_RELAY_URL`.
It continues collecting other books on bet365 outages. The frontend opt-in is
`ENABLE_BET365=true` for GitHub builds (`REACT_APP_ENABLE_BET365` locally); the
page independently removes expired browser quotes while preserving other books.

Live local delivery was verified on November 15: three new website captures on
consecutive minutes reached the loopback relay, and the actual collector
returned **9 NBA games / 27 markets** with source age 25 seconds on the final
read. This verifies recurring browser -> local relay -> parser delivery.
HA/Cloudflare/AWS production rollout still requires publishing app 0.3.0,
moving the publisher to the protected relay, and enabling the explicit flags.
See [publisher setup](../tools/bet365-devtools/README.md) for complete steps.
