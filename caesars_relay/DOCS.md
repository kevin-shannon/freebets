# Caesars relay on Home Assistant OS

The app fetches public Caesars JSON using your home internet connection. AWS
Lambda still runs the collector, normalizes the odds, and publishes to S3.

```text
Lambda -> Cloudflare Access -> existing Cloudflare Tunnel -> this app -> Caesars
```

## 1. Install the app

In Home Assistant, open **Settings -> Apps -> Install app -> menu -> Repositories**
(older releases call these **Add-ons** and **Add-on Store**). Add:

```text
https://github.com/kevin-shannon/freebets
```

Install **Freebets Caesars Relay**. Home Assistant builds the container locally;
the initial install can take a few minutes. Supported architectures are `amd64`
and `aarch64`.

Generate a token on your computer:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Store that value in the app's **relay_token** option. Keep it in your password
manager and enter it directly in Home Assistant and Lambda; do not post it in
chat, screenshots, or the repository. It is a new relay token, unrelated to any
Home Assistant or sportsbook account token.

Set **region** to `nj`, matching the collector's current default. If changing the
collector's `SPORTSBOOK_REGION`, set this app to the same two-letter state.

Start the app and enable **Start on boot** and **Watchdog**. Its log should say:

```text
Caesars relay listening on port 8787, region nj
```

`http://HOME_ASSISTANT_LAN_IP:8787/health` returns `{"status":"ok"}`. This is a
liveness check, not a check of Caesars access. The odds endpoints require the
relay token.

## 2. Add a route to your existing tunnel

Use a dedicated hostname, for example `caesars-relay.kevinshannon.com`, pointed
through the existing tunnel to:

```text
http://HOME_ASSISTANT_LAN_IP:8787
```

Use the LAN address of the Home Assistant machine. `localhost` inside another
app/container may refer to that container instead of Home Assistant's host.
Keep your existing Home Assistant hostname and tunnel route in place.

For a dashboard-managed tunnel, add a **Published application route** in
Cloudflare. If the tunnel is managed by your Home Assistant Cloudflared app,
add this hostname/service pair using that app's additional-host configuration.
The exact option name depends on which tunnel app you installed.

## 3. Protect the hostname with Cloudflare Access

Create a **Self-hosted** Access application covering the entire relay hostname.
Create an Access service token and add a policy with action **Service Auth**,
including that specific service token. The collector authenticates using
`CF-Access-Client-Id` and `CF-Access-Client-Secret` on every relay request.

Interactive browser login policies are insufficient for Lambda. The collector
refuses redirects, including redirects to an Access login page. Cloudflare
Access protects the public hostname; the app's separate relay token protects
direct requests on your home network.

## 4. Configure and test the collector

In **AWS Lambda -> scrape-books -> Configuration -> Environment variables**, add
the following while preserving the existing variables:

| Variable | Value |
| --- | --- |
| `CAESARS_RELAY_URL` | `https://caesars-relay.kevinshannon.com` (your chosen HTTPS origin, no path) |
| `CAESARS_RELAY_TOKEN` | The same token stored in the app's `relay_token` option |
| `CAESARS_RELAY_ACCESS_CLIENT_ID` | Cloudflare Access service-token client ID |
| `CAESARS_RELAY_ACCESS_CLIENT_SECRET` | Cloudflare Access service-token secret |

Relay routing takes precedence over `CAESARS_PROXY_URL` for Caesars. Other books
keep their existing routing. The deployment workflow preserves these Lambda
environment settings. A relay connection/access failure stops further relay
attempts during that collection so the other books can finish. Each new
collection retries the relay, including warm Lambda invocations.

You can first set these variables in a local terminal and run:

```powershell
npm run scrape:check -- --books caesars --sports nba --region nj
```

Then invoke the Lambda test with `{}` or wait for its next scheduled collection.
Verify Caesars has `state: "ok"` and nonzero markets in the published
`scrape-status.json`, then confirm its quotes appear in `output.json`. Prices
are live only after that end-to-end check succeeds.

To disable the relay, remove `CAESARS_RELAY_URL` from Lambda. The collector then
uses the configured Caesars forward proxy, or its existing direct connection.

## What the app accepts

- GET requests to Caesars v4 NBA/NHL/MLB schedule and event-detail paths for the
  configured state. The upstream host is fixed to `api.americanwagering.com`.
- Only the schedule's `competitionId` and event's `useEventPayloadWithTabNav`
  query parameters. Arbitrary URLs, private-network targets, write methods, and
  upstream redirects are rejected.
- Only public sportsbook headers are forwarded. Relay credentials, Cloudflare
  Access credentials, cookies, and forwarded-IP headers stop at the relay.
- Upstream connections use certificate verification, bounded timeouts, four
  concurrent requests, and a maximum decoded response size of 8 MiB.

The app needs no Home Assistant API access, host filesystem mounts, Docker API
access, or router port forwarding. The container reads its app options, then
drops root privileges. Credentials and upstream response bodies are not logged.

## Troubleshooting

- **App will not start:** set a random `relay_token` of at least 32 characters;
  confirm the two-letter lowercase state and that port 8787 is available.
- **Cloudflare 502/relay unreachable:** check the tunnel's service address and
  app health from the tunnel host/container. They must reach the same port.
- **Relay 401/Access errors/login redirect:** check the relay token, both Access
  service-token fields, and the **Service Auth** policy.
- **Relay 400:** check that app region matches `SPORTSBOOK_REGION` and that the
  collector has the current relay integration.
- **Caesars upstream 403:** the request reached Caesars through this server, but
  Caesars still denied it. Confirm this server uses the intended home connection;
  acceptance on the Home Assistant host has not been assumed from desktop tests.

Sources: [Home Assistant app repositories](https://contributors.home-assistant.io/apps/guides/repository/),
[Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/get-started/),
[Cloudflare Access service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).
