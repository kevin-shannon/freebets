# Self-hosted bet365 NBA publisher

This local DevTools extension observes the existing page's own public MO NBA
response. It does not launch an automated browser, generate request tokens,
make separate odds requests, or import/export sportsbook sessions. When you
enable publishing it reloads only the existing MO NBA tab once per minute and
posts each newly observed response to your chosen relay.
It uses Chrome's documented `devtools.network.onRequestFinished` and
`request.getContent` APIs. Only the exact captured MO NBA route is eligible.

Chrome, the NBA tab, and DevTools must stay open on an awake machine. Collection
continues when another DevTools panel is selected, but closing DevTools stops
the publisher. It does not run a browser inside Home Assistant OS or Lambda.
Automated Chrome and Firefox stalled before requesting odds; this uses the
user's proven normal browser session instead.

## Load and capture

1. Close the automated test's window. Open your normal Chrome session.
2. Visit `chrome://extensions`, turn on **Developer mode**, choose **Load
   unpacked**, and select this folder:
   `C:\Users\kever\Documents\projects\freebets\tools\bet365-devtools`.
3. Open the public bet365 MO NBA page, without signing into a sportsbook account.
4. Open F12. If DevTools was already open during installation, close and reopen
   it. Select **Freebets odds** (possibly inside the overflow `»` menu).
5. Keep that panel open and reload the NBA page. Matching requests appear in
   the panel. A nonempty pipe response containing prices enables **Save public
   odds response**. Click it to download `bet365-mo-nba-capture.txt`.

The panel ignores all unrelated response bodies. It stores only the latest
matching public pipe text in memory until a page navigation or panel closure.
Sportsbook cookies, request-token headers and HAR files are not saved or
published. It has no background worker, cookie permission, debugger permission,
or content script. Its only granted host permission is the relay origin you
approve when starting. Optional eligibility for HTTPS origins is declared in
the manifest; it does not grant access to every host. Relay credentials remain
in the extension session unless you check **Remember credentials on this
device**, which saves them to local extension storage, not Chrome Sync. Remove
the extension to clear its stored settings.

## Test publishing locally

1. Start the loopback receiver (already running during this session):

   ```powershell
   python src/scrape/run_local_browser_relay.py
   ```

   It listens only on `http://127.0.0.1:8788` and creates a random relay token in
   ignored `.local/bet365-publisher/relay-token.txt`. It never prints the token.
2. Reload the unpacked extension in `chrome://extensions`, close/reopen F12, and
   select **Freebets odds** on the MO NBA page.
3. Set **Relay origin** to `http://127.0.0.1:8788` and enter the token from that
   file in **Relay token**. Leave Cloudflare fields empty for this loopback test.
4. Click **Start publishing** and grant access only to that local origin. This
   triggers a cache-bypassing page reload. Only a new matching response may be
   uploaded; starting does not republish a previously captured file.
5. Confirm **Published successfully** advances at least twice a minute apart.
   Then read the capture through the real collector in another terminal:

   ```powershell
   $env:BET365_RELAY_URL = 'http://127.0.0.1:8788'
   $env:BET365_RELAY_TOKEN = (Get-Content .local/bet365-publisher/relay-token.txt -Raw).Trim()
   $env:BET365_REGION = 'mo'
   npm run scrape:check -- --books bet365 --sports nba
   ```

   Source timestamps and `source: browser_capture` appear in the report. The
   receiver expires captures after 120 seconds by default. It does not persist
   them across restarts. Stop publishing and the collector will report stale
   captures instead of serving old quotes.

The publisher refreshes only the exact MO NBA page. Navigating away stops
eligible uploads and refreshes. A failed upload is not retried with the old
body; the next new website response is the next upload attempt. The relay
rejects old timestamps, malformed bodies, and uploads older than its current
capture. Start publishing again after reopening DevTools; saved credentials
alone do not auto-enable it.

## Move the verified path to Home Assistant and Lambda

After the code is published:

1. Update the existing **Freebets Caesars Relay** HA app to **0.3.0**. Set
   `enable_bet365: true`, `bet365_source: browser`, and
   `bet365_max_age_seconds: 120`. Preserve the Caesars `region` and `relay_token`.
2. In the browser panel, replace the loopback origin with your existing HTTPS
   relay origin. Use its relay token plus the existing Cloudflare Access service
   token's client ID and secret. Click **Start publishing** and approve access
   to this origin. The existing tunnel and Service Auth application are reused.
3. Verify two uploads through the protected origin and a targeted collector
   check before enabling scheduled collection. Enter credentials locally; do
   not send them in chat.
4. In Lambda, preserve the working Caesars variables and add:

   | Variable | Value |
   | --- | --- |
   | `BET365_ENABLED` | `true` |
   | `BET365_REGION` | `mo` |
   | `BET365_RELAY_URL` | Your existing relay HTTPS origin, without a path |

   The bet365 token/Access credentials default to the existing Caesars relay
   credentials. Optional `BET365_RELAY_TOKEN`, `BET365_RELAY_ACCESS_CLIENT_ID`
   and `BET365_RELAY_ACCESS_CLIENT_SECRET` override them if a different relay
   is used. No browser or additional paid service runs in Lambda.
5. Invoke Lambda and verify `books.bet365.source: browser_capture`, recent
   `captureObservedAt`, `state: ok`/`no_events`, and correct market counts.
   Unsupported NHL/MLB sports are explicit and do not make valid NBA coverage
   partial. Failed/stale NBA captures do make overall coverage partial while
   retaining the other books' successful data.
6. Set GitHub repository variable **ENABLE_BET365=true** for the next website
   build, or `REACT_APP_ENABLE_BET365=true` for a local build. Book options then
   include bet365 where available. The page rechecks source freshness every ten
   seconds and removes expired bet365 prices even without another feed update.

The current bet365 source is MO NBA, independent of other books' configured
regions. State availability filtering does not change the feed's region.
Other leagues and region-specific captures remain future additions. The rest
of the site is not dependent on this browser staying open.

To roll back, stop publishing and remove `BET365_ENABLED` and the frontend
variable. The bet365 route remains disabled by default on a fresh HA install.

## Validate the downloaded response

From the repository root, adjust the input path if Chrome saved the file
somewhere else:

```powershell
python src/scrape/inspect_bet365_capture.py --file "$env:USERPROFILE\Downloads\bet365-mo-nba-capture.txt" --output .local/bet365-manual/output.json
```

The parser prints event/market counts and writes normalized public odds to the
specified ignored local file. Invalid input exits with a failure and does not
replace an existing output. The extension's `captured_unvalidated` status alone
does not establish correct prices, teams, lines, dates, or successful collection;
the Python parser is the validation step. Parser warnings must be investigated.

The manual file command does not update a public feed or enable a book.

## Checks

No installation/build is required for the extension or its tests:

```powershell
npm test --prefix tools/bet365-devtools
```

Tests cover matching scope, consistency with the browser observer, rejection of
empty/HTML/invalid bodies, base64 response decoding, and minimal manifest
permissions.

## Verified manual result

On November 15, 2026, the user captured a 17,348-byte response through this panel
in normal Chrome. The Python parser accepted 8 NBA events and 24 markets (8
moneylines, 8 spreads, 8 totals), with zero warnings. Normalized odds were saved
to `.local/bet365-manual/output.json`. This establishes a working manual
capture/parse path, not a working automated browser or scheduled collector.

The browser publisher was subsequently verified against the live website and
the loopback relay on November 15. New captures were accepted on three
consecutive minutes (07:53, 07:54, 07:55 UTC), and the real collector read **9
NBA events / 27 markets**, with source age 25 seconds on the final check. This
establishes recurring local delivery, not a deployed HA/Cloudflare/Lambda path.
