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
npm run build
```

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
