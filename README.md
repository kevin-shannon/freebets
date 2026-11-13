# freebets
sportsbook bets aggregator

### Try it out: https://kevinshannon.com/freebets/

## Run locally

```powershell
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

See [the sportsbook investigation](docs/sportsbook-feeds.md) for current results,
endpoint migrations, sources, and the remaining access restrictions.
