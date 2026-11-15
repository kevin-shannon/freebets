# freebets
sportsbook bets aggregator

### Try it out: https://kevinshannon.com/freebets/

## Run locally

```powershell
# Python 3.13 is used by the production collector and its build.
python -m pip install -r src/scrape/requirements.txt
npm run scrape
npm start
```

The development app reads `public/output.json` and `public/scrape-status.json`
automatically at http://localhost:3000/freebets. No source edits are needed.
For continuous updates, run `npm run scrape:watch` in a second terminal. The
watcher collects every 60 seconds; the app reloads the files every 60 seconds and
hides quotes more than 15 minutes old. Feeds currently include pregame NBA, NHL,
and MLB full-game markets; an offseason league can legitimately have no games.

```powershell
# Diagnose all feeds without changing the odds files.
npm run scrape:check

# Refresh a subset, or select a consistent state for all four sources.
npm run scrape -- --books betmgm fanduel --sports nba nhl --region nj

# Regression tests and frontend validation.
npm run scrape:test
npm run tsc
npm test -- --watchAll=false --runInBand
npm run build
```

## Interface

Home introduces the site and getting-started workflow. The top navigation opens
Bets, Tools, and Learn, and the logo returns Home. Direct hash links work with
GitHub Pages. Tools currently previews the planned bet tracker and standalone
calculators; the market-linked calculators are available on Bets.

The state selector saves your preference, shows active online sportsbooks, and
limits book filters and comparison results to available connected operators.
Only states with active statewide online betting are selectable. Leaving the
state unset shows all ten operators and selects all connected books.
The catalog covers the ten requested brands across all 50 states and DC, with
sources and a verification date. It does not change the current feed's region
or connect additional odds feeds. See the [full availability list](docs/sportsbook-availability.md)
and [site structure](docs/site-structure.md) for details.

Appearance and odds format are saved on the current device under Preferences.
For the adapter contract, registration steps and bet365 investigation status,
see [adding sportsbooks](docs/adding-sportsbooks.md).
System appearance follows operating-system changes. American, decimal, and
implied-probability formats apply to the results and calculator; optional odds
limits remain explicitly American.

Shared colors live in `src/components/common/etc/variables.css` and apply at the
document root so dialogs inherit the selected theme. Settings and calculators
use native modal dialogs with Escape dismissal, focus restoration, and keyboard
navigation. Animations respect reduced-motion preferences.

The feed refreshes in the background every 60 seconds without navigating or
reloading the page. An open calculator keeps its captured odds, amounts, and
active tab even if the refreshed market moves off the page or becomes unavailable.

`npm start` excludes the generated feed JSON and its atomic-write temporary files
from CRA's public-asset watcher. Local scraper updates therefore use background
polling instead of triggering a full-page reload. Source-code Fast Refresh and
reloads for other public assets remain enabled.

## Feed access and deployment

`SPORTSBOOK_REGION` defaults to `nj`. State-specific access varies. Both `local`
and `check` exit 1 for incomplete coverage, even when working feeds successfully
produce odds. Read the per-book report to distinguish blocked access, a schema
change, and a valid empty schedule. A total failure preserves the
previous odds file and marks the status as failed.

Caesars sends public platform metadata and generates its own device ID for each
collection. It needs no account login, bearer token, or browser WAF token.

Production continues to read S3. Override `REACT_APP_DATA_URL` and optionally
`REACT_APP_STATUS_URL` at build time to use another feed. Lambda collects on every
invocation, including warm invocations, and writes both JSON files to
`OUTPUT_BUCKET` (default `stanleys-bucket`). Publishing these changes requires
deploying the app and Lambda separately.

Local and hosted feed access can differ. Production currently receives live
BetMGM, DraftKings, and FanDuel prices; Caesars returns HTTP 403 from cloud hosts
despite working locally. The Lambda deployment includes a live collection check:
usable partial coverage produces a warning and a job summary. Invocation errors,
failed collections, and invalid responses fail the deployment check. A valid
empty schedule passes. See the per-book production `scrape-status.json` for
current coverage; the standalone `scrape:check` command remains strict.

For an always-on Home Assistant OS server, install the
[Caesars home relay app](caesars_relay/DOCS.md) from this repository and publish
it through your existing Cloudflare Tunnel with Access service authentication.
Set `CAESARS_RELAY_URL`, `CAESARS_RELAY_TOKEN`,
`CAESARS_RELAY_ACCESS_CLIENT_ID`, and `CAESARS_RELAY_ACCESS_CLIENT_SECRET` in
Lambda. Caesars requests then run through the home relay; aggregation and S3
publishing remain in AWS. Relay routing takes precedence over the optional
forward proxy below. The server and tunnel must be installed and a live
collection verified before Caesars can be considered restored in production.

bet365 has an optional free, self-hosted [normal-browser publisher](tools/bet365-devtools/README.md).
It sends fresh MO NBA responses to the home relay; Lambda reads the expiring
cache. Recurring local delivery is verified. Production enablement remains
opt-in through `BET365_ENABLED` in Lambda and `ENABLE_BET365` for frontend builds.
The browser/DevTools must stay open; expired quotes are removed independently.

Caesars can optionally use an external HTTP/HTTPS forward proxy while the
collector stays in Lambda. Configure `CAESARS_PROXY_URL` in Lambda's environment
with the endpoint supplied by your proxy service, such as
`https://USERNAME:PASSWORD@proxy.example.com:8443`. URL-encode credentials as
needed and keep the actual value out of source control. This setting applies
only to `api.americanwagering.com`; all other books keep their existing routing.
Leaving it unset keeps the existing routing. The proxy must provide a working
exit network; changing the route has not yet been verified to resolve Caesars'
403 response. No proxy service is configured or provisioned by this code.

To compare direct and proxy access with the same diagnostic request, configure
the variable locally, then run:

```powershell
python src/scrape/diagnose_caesars_request.py
python src/scrape/diagnose_caesars_request.py --via-proxy
```

The diagnostic labels the route without logging the proxy URL or credentials.
After configuring the production endpoint, check the live per-book status to
verify actual access; a successful deployment alone does not establish coverage.

See [the sportsbook investigation](docs/sportsbook-feeds.md) for current results,
endpoint migrations, sources, and the remaining access restrictions.
