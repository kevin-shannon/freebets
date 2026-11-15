import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createPublisher, relayOrigin, isNbaPage } from "./publisher.js";

const body = fs.readFileSync(new URL("../../src/scrape/tests/fixtures/bet365-nba.txt", import.meta.url), "utf8");
const page = "https://www.mo.bet365.com/#/AC/B18/C20604387/D48/E1453/F10/";
const query = new URLSearchParams({ lid: "32", zid: "0", pd: "#AC#B18#C20604387#D48#E1453#F10#", cid: "198", cgid: "3", ctid: "198" });
const settings = { origin: "https://relay.example.com", token: "test-relay-token-" + "a".repeat(48), clientId: "test-access-id", clientSecret: "test-access-secret" };
const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };

function setup(send = async () => new Response(JSON.stringify({ state: "accepted" }))) {
  let time = Date.parse("2026-11-15T08:00:00Z"), refresh, reloads = 0, url = page;
  const sent = [];
  const publisher = createPublisher({ now: () => time, getPageUrl: async () => url, reload: () => { reloads++; },
    repeat: (fn, ms) => { assert.equal(ms, 60000); refresh = fn; return 1; }, cancelRepeat: () => {},
    send: async (...args) => { sent.push(args); return send(...args); } });
  const capture = (timestamp = new Date(time).toISOString(), content = body) => publisher.handle({
    request: { url: `https://www.mo.bet365.com/contentdata/matchmarketscontentapi/markets?${query}`, method: "GET", headers: [{ name: "Cookie", value: "private-site-cookie" }] },
    response: { status: 200 }, startedDateTime: timestamp, getContent: callback => callback(content, ""),
  });
  return { publisher, sent, capture, refresh: () => refresh(), reloads: () => reloads,
    advance: ms => { time += ms; }, navigate: value => { url = value; publisher.navigated(); } };
}

test("publisher uses a secure configured origin and only refreshes the captured page", () => {
  assert.equal(relayOrigin("https://relay.example.com/"), "https://relay.example.com");
  assert.equal(relayOrigin("http://127.0.0.1:8788"), "http://127.0.0.1:8788");
  for (const value of ["http://example.com", "https://user:secret@example.com", "https://relay.example.com/path", "https://relay.example.com/?token=x", "https://www.mo.bet365.com"]) assert.throws(() => relayOrigin(value));
  assert(isNbaPage(page));
  assert(!isNbaPage("https://www.mo.bet365.com/#/account"));
  assert(!isNbaPage(page.replace("www.mo", "example")));
});

test("start refreshes but does not republish a previously captured body", async () => {
  const test = setup();
  test.capture();
  await test.publisher.start(settings);
  await flush();
  assert.equal(test.reloads(), 1);
  assert.equal(test.sent.length, 0);
  await test.refresh();
  assert.equal(test.reloads(), 2);
  assert.equal(test.sent.length, 0);
  test.publisher.stop();
});

test("a newly observed feed is posted without sportsbook credentials and status omits secrets", async () => {
  const test = setup();
  await test.publisher.start(settings);
  test.capture();
  await flush();
  assert.equal(test.sent.length, 1);
  const [url, request] = test.sent[0];
  assert.equal(url, "https://relay.example.com/bet365/capture");
  assert.equal(request.body, body);
  assert.equal(request.credentials, "omit");
  assert.equal(request.redirect, "error");
  assert.equal(request.headers.Authorization, "Bearer " + settings.token);
  assert.equal(request.headers["CF-Access-Client-Secret"], settings.clientSecret);
  assert.equal(request.headers.Cookie, undefined);
  assert.equal(request.headers["X-Net-Sync-Term"], undefined);
  assert.equal(test.publisher.snapshot().status, "published");
  const snapshot = JSON.stringify(test.publisher.snapshot());
  for (const secret of [settings.token, settings.clientSecret, "private-site-cookie"]) assert(!snapshot.includes(secret));
  test.publisher.stop();
});

test("missing timestamps, old responses and unrelated tabs never publish", async () => {
  const test = setup();
  await test.publisher.start(settings);
  test.capture("bad");
  test.capture("2026-11-15T07:59:00Z");
  await flush();
  assert.equal(test.sent.length, 0);
  test.navigate("https://example.com/");
  test.capture();
  await flush();
  await test.refresh();
  assert.equal(test.sent.length, 0);
  assert.equal(test.reloads(), 1);
  test.publisher.stop();
});

test("upload failure waits for a new capture instead of refreshing old data", async () => {
  const test = setup(async () => new Response("denied", { status: 401 }));
  await test.publisher.start(settings);
  test.capture();
  await flush();
  assert.equal(test.publisher.snapshot().status, "relay_rejected");
  await test.refresh();
  assert.equal(test.sent.length, 1);
  test.advance(60000);
  test.capture();
  await flush();
  assert.equal(test.sent.length, 2);
  test.publisher.stop();
  test.capture();
  await flush();
  assert.equal(test.sent.length, 2);
});
