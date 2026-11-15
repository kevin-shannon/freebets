const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { chromium } = require("playwright-core");
const { feedRoute, classify, parseCapture, observe, PAGE_URL } = require("./check.cjs");
const fixture = fs.readFileSync(path.resolve(__dirname, "../../src/scrape/tests/fixtures/bet365-nba.txt"));
const query = new URLSearchParams({ lid: "32", zid: "0", pd: "#AC#B18#C20604387#D48#E1453#F10#", cid: "198", cgid: "3", ctid: "198" });
const feed = `https://www.mo.bet365.com/contentdata/matchmarketscontentapi/markets?${query}`;

test("recognizes only the captured origin, route, and query", () => {
  assert.equal(feedRoute(feed), "verified");
  assert.equal(feedRoute(feed + "&zid=0"), "unverified");
  assert.equal(feedRoute(feed + "&token=private-value"), "unverified");
  assert.equal(feedRoute(feed.replace("zid=0", "zid=5")), "unverified");
  assert.equal(feedRoute(feed.replace("www.mo", "www.nj")), "other");
  assert.equal(feedRoute("not a URL"), "other");
});

test("200 empty, challenge and HTML responses are not odds", () => {
  assert.equal(classify(200, "text/plain", Buffer.alloc(0)), "empty");
  assert.equal(classify(200, "text/html", Buffer.from("<html>Just a moment</html>")), "challenge");
  assert.equal(classify(403, "text/html", Buffer.from("blocked")), "blocked");
  assert.equal(classify(200, "text/plain", fixture), "pipe_feed");
  assert.equal(classify(200, "text/plain", Buffer.from("other")), "unexpected_response");
});

test("Python bridge validates real pipe records and emits normalized bet365 odds", () => {
  const result = parseCapture(fixture);
  assert.equal(result.state, "ok");
  assert.equal(result.events, 2);
  assert.equal(result.normalizedMarkets, 6);
  assert(result.rows.every(row => row.outcomes.every(outcome => Object.values(outcome.books).every(books => books.includes("bet365")))));
  assert.throws(() => parseCapture(Buffer.from("F|CL;ID=wrong;|")), /did not pass/);
});

test("browser observes page-generated odds without logging request credentials", async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.route("**/*", route => {
      if (route.request().url().startsWith("https://www.mo.bet365.com/contentdata/")) {
        return route.fulfill({ contentType: "text/plain", body: fixture });
      }
      return route.fulfill({ contentType: "text/html", body: `<script>fetch(${JSON.stringify(feed)}, {headers:{'X-Net-Sync-Term':'private-test-header'}})</script>` });
    });
    const report = await observe(page, { timeoutMs: 8000 });
    assert.equal(report.state, "ok");
    assert.equal(report.result.normalizedMarkets, 6);
    assert.equal(report.feedResponses[0].state, "pipe_feed");
    assert(!JSON.stringify(report).includes("private-test-header"));
    assert.equal(report.documentStatus, 200);
    await context.close();
  } finally { await browser.close(); }
});

test("browser fails clearly at a blocked document before the feed loads", async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    await page.route("**/*", route => route.fulfill({ status: 403, contentType: "text/html", body: "Blocked" }));
    const report = await observe(page, { timeoutMs: 8000 });
    assert.equal(report.state, "blocked");
    assert.equal(report.documentStatus, 403);
    assert.equal(report.result, undefined);
    assert.equal(report.feedResponses.length, 0);
  } finally { await browser.close(); }
});

test("browser does not call an empty 200 a successful collection", async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    await page.route("**/*", route => route.request().url().includes("/contentdata/")
      ? route.fulfill({ status: 200, contentType: "text/plain", body: "" })
      : route.fulfill({ contentType: "text/html", body: `<script>fetch(${JSON.stringify(feed)})</script>` }));
    const report = await observe(page, { timeoutMs: 1500 });
    assert.equal(report.state, "empty");
    assert.equal(report.result, undefined);
  } finally { await browser.close(); }
});

test("stalled page reports progress and failed bootstrap resources without query secrets", async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    const progress = [];
    await page.route("**/*", route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === "/missing.js") return route.fulfill({ status: 503, contentType: "text/javascript", body: "" });
      if (pathname === "/config") return route.abort("connectionfailed");
      if (pathname === "/defaultapi/sports-configuration") return route.fulfill({ contentType: "application/json", body: "" });
      return route.fulfill({ contentType: "text/html", body: `<div class="bl-Preloader_Spinner">Loading</div><script src="/missing.js?secret=private-query"></script><script>fetch('/config?secret=private-query').catch(()=>{});fetch('/defaultapi/sports-configuration?secret=private-query')</script>` });
    });
    const report = await observe(page, { timeoutMs: 1200, progressMs: 100, onProgress: value => progress.push(value) });
    assert.equal(report.state, "page_stalled");
    assert.equal(report.page.preloaderVisible, true);
    assert(progress.some(value => value.phase === "document" && value.status === 200));
    assert(progress.some(value => value.phase === "waiting"));
    assert(report.network.httpErrors.some(value => value.path === "/missing.js" && value.status === 503));
    assert(report.network.failedRequests.some(value => value.path === "/config"));
    assert(report.network.bootstrapResponses.some(value => value.path === "/defaultapi/sports-configuration" && value.bytes === 0));
    assert(!JSON.stringify({ report, progress }).includes("private-query"));
  } finally { await browser.close(); }
});

test("socket diagnostics count frames without retaining payloads or query tokens", async () => {
  const page = new EventEmitter();
  page.title = async () => "";
  page.evaluate = async () => ({ readyState: "complete" });
  const socket = new EventEmitter();
  socket.url = () => "wss://example.com/zap/?token=private-query";
  const report = await observe(page, { timeoutMs: 100, navigate: async () => {
    page.emit("websocket", socket);
    socket.emit("framesent", { payload: "private-frame" });
    socket.emit("framereceived", { payload: "private-frame" });
    socket.emit("socketerror", "private-error");
  } });
  assert.deepEqual(report.network.webSockets, [{ host: "example.com", path: "/zap/", receivedFrames: 1, sentFrames: 1, error: true, closed: false }]);
  assert(!JSON.stringify(report).includes("private-"));
  assert.equal(socket.listenerCount("framereceived"), 0);
});

test("captures odds arriving after the deadline while the browser is still observed", async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    const progress = [];
    await page.route("**/*", route => route.request().url().includes("/contentdata/")
      ? route.fulfill({ contentType: "text/plain", body: fixture })
      : route.fulfill({ contentType: "text/html", body: "<p>Waiting for odds</p>" }));
    const report = await observe(page, { timeoutMs: 100, settleMs: 5000,
      onProgress: value => {
        progress.push(value);
        // Reproduce a page that starts its odds request as finalization begins.
        if (value.phase === "deadline_grace") void page.evaluate(url => fetch(url), feed).catch(() => {});
      } });
    assert.equal(report.state, "ok");
    assert.equal(report.captureAfterDeadline, true);
    assert.equal(report.result.normalizedMarkets, 6);
    assert(progress.some(value => value.phase === "odds_captured" && value.afterDeadline));
  } finally { await browser.close(); }
});

test("keep-open observation waits beyond the deadline until the user closes the page", async () => {
  const page = new EventEmitter();
  page.title = async () => "";
  page.evaluate = async () => ({ readyState: "complete" });
  const phases = [];
  const report = await observe(page, { timeoutMs: 50, continueAfterDeadline: true,
    navigate: async () => {},
    onProgress: value => {
      phases.push(value.phase);
      if (value.phase === "deadline_reached") setTimeout(() => page.emit("close"), 100);
    } });
  assert(phases.includes("deadline_reached"));
  assert.equal(report.state, "browser_closed");
  assert(report.elapsedMs >= 140);
});
