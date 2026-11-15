# Local bet365 browser check

This diagnostic opens the public MO NBA page in a fresh, logged-out browser and
observes the site's own matching responses. It does not make a separate feed
request, recreate request tokens, import personal browser profiles, or save
cookies/headers. It stops if the site returns an access block or challenge.

Requires Node 20+, installed Chrome or Microsoft Edge, Python, and the normal
scraper Python dependencies. Browser tooling is isolated from the website and
Lambda dependencies. Install it from its own directory:

```powershell
Push-Location tools/bet365-browser
npm install --ignore-scripts
Pop-Location
```

From the repository root:

```powershell
# Headless diagnostic:
npm run scrape:browser

# Interactive local test: opens a fresh visible Chrome window.
npm run scrape:browser -- --headed --timeout 120

# Keep observing beyond the deadline, until you close Chrome:
npm run scrape:browser -- --headed --keep-open --timeout 120

# Alternative if Edge is installed:
npm run scrape:browser -- --headed --channel msedge --timeout 120

# Optional supported Firefox build, installed only into .local:
npm run scrape:browser:install -- firefox
npm run scrape:browser -- --headed --channel firefox --timeout 30
```

The visible test allows normal navigation on the public page if it loads. No
login is needed for the captured odds. Blocked/challenged runs report the
failure and exit; the tool does not automate challenges or evade detection.
It closes the temporary browser at completion or the timeout. A failed run
can differ from a working personal browser and does not prove a general outage.

With `--keep-open`, the deadline is a logged checkpoint: observation continues
until usable odds arrive or you close the page. If odds are captured, the report
and normalized data are saved immediately and the window remains open for
inspection until you close it. This option requires `--headed` and deliberately
has no automatic deadline for closing the window. It makes no changes to the
site's security checks or browser identity.

The terminal reports the initial document status and progress every ten seconds.
At the deadline it logs a five-second grace period with the browser and odds
observer still active. Late odds are parsed and marked `captureAfterDeadline`;
observation completion and browser shutdown are logged separately. This makes
it possible to distinguish a late feed from a page changing during shutdown.
The timeout is the main observation window, not a delay between retries. A
spinner without a feed is reported as `page_stalled` at the deadline. The final
report includes failed requests, HTTP error statuses, pending resource paths,
and a JavaScript error count to distinguish a stalled bootstrap from missing
odds. Bootstrap response sizes and WebSocket connection errors/frame counts help
identify silent startup failures. Socket payloads, resource query strings,
request headers, and raw exception text are omitted.

The observer accepts only the captured MO NBA endpoint and query, including
`zid=0`. Changed routes are reported as `unverified_route` and require validation
before parsing. It requires nonempty pipe text and passes it to the existing
Python NBA parser. An empty 200, HTML, or a parser failure is not success.

Results are saved under ignored `.local/bet365-browser/`:

- `report.json`: status, response sizes, observation time, and parser counts.
- `output.json`: normalized odds when a usable response was observed.

Previous diagnostic results are cleared when starting a valid run. No public
feed file, connected-book flag, relay configuration, or Lambda setting changes.
Exit code zero requires valid nonempty odds without parser warnings. Partial
captures are reported and saved for diagnosis but return a nonzero exit code.

## Validation

```powershell
npm test --prefix tools/bet365-browser
```

The test suite uses local intercepted responses in Chrome, plus the real Python
parser and recorded feed. It covers price normalization, changed routes,
credential-free reports, blocked navigation, and empty successful responses.
This is distinct from live collection.

## Live result

On November 15, 2026, the real headless Chrome test received HTTP 403 on the page
document before any odds response. The browser collection path therefore
remains unverified.

Visible fresh Chrome tests returned document HTTP 200 but remained on the
preloader for 30–120 seconds without requesting the captured odds endpoint.
The instrumented run completed 77 HTTP requests with no failures or HTTP errors
and no uncaught page errors. Observed bootstrap responses were nonempty. Several
WebSockets exchanged frames; the pre-match host connections closed while the
publisher/private connections remained open. These observations do not establish
why application startup stalled or prove deliberate automation blocking.
Compare ordinary Chrome outside the tool with the user's working Firefox
session before changing browser configuration or claiming collection succeeds.

A visible automated Firefox 159 test also stalled on November 15: document 200,
55 completed HTTP requests, nonempty bootstrap responses, no HTTP errors or
uncaught page errors, and no odds response. Its pre-match WebSockets also closed
and reconnected. Ordinary Chrome was confirmed working by the user. The
[manual DevTools capture panel](../bet365-devtools/README.md) is the next local
experiment; automation-specific detection is a possibility, not a proven cause.
