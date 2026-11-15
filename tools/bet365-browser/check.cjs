// Observe the website's own requests. Do not synthesize tokens, replay cookies,
// inject headers, or connect to an existing personal browser profile.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "../..");
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(ROOT, ".local/playwright-browsers");
const PAGE_URL = "https://www.mo.bet365.com/#/AC/B18/C20604387/D48/E1453/F10/";
const FEED_PATH = "/contentdata/matchmarketscontentapi/markets";
const EXPECTED = { lid: "32", zid: "0", pd: "#AC#B18#C20604387#D48#E1453#F10#", cid: "198", cgid: "3", ctid: "198" };
const MAX_BYTES = 8 * 1024 * 1024;

function feedRoute(value) {
  let url;
  try { url = new URL(value); } catch { return "other"; }
  if (url.origin !== "https://www.mo.bet365.com" || url.pathname !== FEED_PATH) return "other";
  return Object.entries(EXPECTED).every(([key, value]) => {
    const values = url.searchParams.getAll(key);
    return values.length === 1 && values[0] === value;
  }) && [...url.searchParams.keys()].every(key => key in EXPECTED) ? "verified" : "unverified";
}

function classify(status, contentType, body) {
  if ([401, 403, 451].includes(status)) return "blocked";
  if (status !== 200) return "http_error";
  if (!body.length) return "empty";
  if (body.length > MAX_BYTES) return "oversized";
  const text = body.toString("utf8").replace(/^\uFEFF/, "");
  if (/html/i.test(contentType) || /^\s*<(?:!doctype|html)/i.test(text)) {
    return /just a moment|challenge-platform|unable to access/i.test(text) ? "challenge" : "html";
  }
  return text.startsWith("F|CL;") ? "pipe_feed" : "unexpected_response";
}

function parseCapture(body) {
  const child = spawnSync(process.env.PYTHON || "python", [path.join(ROOT, "src/scrape/inspect_bet365_capture.py")], {
    cwd: ROOT, input: body, encoding: "utf8", timeout: 15000, maxBuffer: 16 * 1024 * 1024,
  });
  if (child.error) throw new Error("Python parser could not run; check Python and scraper dependencies.");
  let parsed;
  try { parsed = JSON.parse(child.stdout); } catch { throw new Error("Python parser did not return a valid report."); }
  if (child.status !== 0) throw new Error("Captured response did not pass the NBA parser.");
  return parsed;
}

function safeResource(request) {
  const url = new URL(request.url());
  return { host: url.hostname, path: url.pathname.slice(0, 200), type: request.resourceType() };
}

async function observe(page, { timeoutMs = 45000, settleMs = 0, continueAfterDeadline = false, navigate = () => page.goto(PAGE_URL, { waitUntil: "domcontentloaded", timeout: Math.min(timeoutMs, 30000) }), parser = parseCapture, onProgress = () => {}, progressMs = 10000 } = {}) {
  const started = Date.now();
  const report = { state: "no_feed", documentStatus: null, feedResponses: [], observedAt: new Date().toISOString(),
    network: { requests: 0, responses: 0, failedRequests: [], httpErrors: [], pageErrorCount: 0, bootstrapResponses: [], webSockets: [] } };
  const inFlight = new Map();
  const requestStarted = request => {
    report.network.requests++;
    try { inFlight.set(request, safeResource(request)); } catch { /* Ignore non-URL resources. */ }
  };
  const requestFinished = request => inFlight.delete(request);
  const requestFailed = request => {
    const resource = inFlight.get(request);
    inFlight.delete(request);
    if (resource && report.network.failedRequests.length < 20) {
      // The browser's raw error text can contain URLs. Keep only its error code.
      const code = /\bERR_[A-Z_]+\b/.exec(request.failure()?.errorText || "")?.[0] || "request_failed";
      report.network.failedRequests.push({ ...resource, code });
    }
  };
  const pageError = () => { report.network.pageErrorCount++; };
  const socketCleanup = [];
  const socketCreated = socket => {
    if (report.network.webSockets.length >= 10) return;
    const url = new URL(socket.url());
    const entry = { host: url.hostname, path: url.pathname, receivedFrames: 0, sentFrames: 0, error: false, closed: false };
    report.network.webSockets.push(entry);
    const receive = () => { entry.receivedFrames++; };
    const send = () => { entry.sentFrames++; };
    const error = () => { entry.error = true; };
    const close = () => { entry.closed = true; };
    for (const [event, handler] of [["framereceived", receive], ["framesent", send], ["socketerror", error], ["close", close]]) {
      socket.on(event, handler);
      socketCleanup.push(() => socket.off(event, handler));
    }
  };
  const progress = setInterval(() => onProgress({ phase: "waiting", elapsedSeconds: Math.round((Date.now() - started) / 1000),
    documentStatus: report.documentStatus, requests: report.network.requests, responses: report.network.responses,
    pendingRequests: inFlight.size, failedRequests: report.network.failedRequests.length,
    httpErrors: report.network.httpErrors.length, feedResponses: report.feedResponses.length }), progressMs);
  const pending = new Set();
  let finish, finishGrace, graceTimer;
  let deadlineReached = false;
  const done = new Promise(resolve => { finish = () => { resolve(); finishGrace?.(); }; });
  const timer = setTimeout(() => {
    deadlineReached = true;
    if (continueAfterDeadline) onProgress({ phase: "deadline_reached", note: "Still observing. Close the Chrome window to finish; the deadline will not close it." });
    else finish();
  }, timeoutMs);
  let closed = false;
  const close = () => { closed = true; finish(); };
  const listen = response => {
    const task = (async () => {
      const request = response.request();
      const url = new URL(response.url());
      report.network.responses++;
      if (response.status() >= 400 && report.network.httpErrors.length < 20) {
        report.network.httpErrors.push({ ...safeResource(request), status: response.status() });
      }
      if (url.origin === "https://www.mo.bet365.com" &&
          (["/Api/1/Blob", "/manifestapi/getmanifest", "/defaultapi/sports-configuration", "/websiteroutingdatacontentapi/routingdata"].includes(url.pathname) || url.pathname.startsWith("/blob/js/")) &&
          report.network.bootstrapResponses.length < 20) {
        const entry = { ...safeResource(request), status: response.status() };
        report.network.bootstrapResponses.push(entry);
        try { entry.bytes = (await response.body()).length; } catch { entry.unreadable = true; }
      }
      if (url.origin === "https://www.mo.bet365.com" && request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        report.documentStatus = response.status();
        onProgress({ phase: "document", status: response.status() });
        if ([401, 403, 451].includes(response.status())) { report.state = "blocked"; finish(); }
      }
      const route = feedRoute(response.url());
      if (route === "other" || request.method() !== "GET") return;
      if (route === "unverified") {
        report.feedResponses.push({ state: "unverified_route", status: response.status() });
        return;
      }
      let body;
      try { body = await response.body(); } catch { report.feedResponses.push({ state: "unreadable", status: response.status() }); return; }
      const state = classify(response.status(), response.headers()["content-type"] || "", body);
      const entry = { state, status: response.status(), bytes: body.length, elapsedMs: Date.now() - started };
      report.feedResponses.push(entry);
      if (state === "pipe_feed") {
        try {
          const parsed = parser(body);
          const { rows, ...summary } = parsed;
          entry.parsed = summary;
          if (rows.length && !report.result) {
            report.result = parsed;
            report.state = parsed.state;
            report.captureAfterDeadline = deadlineReached;
            onProgress({ phase: "odds_captured", elapsedMs: Date.now() - started, afterDeadline: deadlineReached, markets: parsed.normalizedMarkets });
            finish();
          }
        } catch { entry.state = "invalid_feed"; }
      }
      if (state === "blocked" || state === "challenge") { report.state = state; finish(); }
    })();
    pending.add(task);
    task.catch(() => { /* No raw request URLs or error text in logs. */ }).finally(() => pending.delete(task));
  };
  page.on("response", listen);
  page.on("close", close);
  page.on("request", requestStarted);
  page.on("requestfinished", requestFinished);
  page.on("requestfailed", requestFailed);
  page.on("pageerror", pageError);
  page.on("websocket", socketCreated);
  try {
    const navigation = Promise.resolve().then(navigate).then(async () => {
      if (!closed && !report.result) {
        const title = await page.title();
        if (/just a moment|access denied|attention required/i.test(title)) { report.state = "challenge"; finish(); }
      }
    }).catch(() => { report.navigationError = true; onProgress({ phase: "navigation_incomplete", note: "Still observing until the overall timeout." }); });
    await done;
    if (deadlineReached && settleMs > 0 && !closed && !report.result && report.state === "no_feed") {
      onProgress({ phase: "deadline_grace", seconds: settleMs / 1000, note: "Browser remains open and odds observation remains active." });
      await new Promise(resolve => { finishGrace = resolve; graceTimer = setTimeout(resolve, settleMs); });
      clearTimeout(graceTimer);
    }
    // Outstanding body reads can hang after a navigation. Bound their cleanup.
    let cleanupTimer;
    await Promise.race([Promise.allSettled([...pending]), new Promise(resolve => { cleanupTimer = setTimeout(resolve, 3000); })]);
    clearTimeout(cleanupTimer);
    void navigation;
    report.network.pendingRequests = [...inFlight.values()].slice(0, 20);
    if (!closed) {
      let inspectionTimer;
      try {
        report.page = await Promise.race([
          page.evaluate(() => {
            const preloader = document.querySelector(".bl-Preloader_Spinner");
            const style = preloader && getComputedStyle(preloader);
            return { readyState: document.readyState,
              preloaderVisible: Boolean(preloader && style.display !== "none" && style.visibility !== "hidden" && preloader.getClientRects().length),
              challengeVisible: /just a moment|attention required|sorry, you have been blocked/i.test(document.title + " " + (document.body?.innerText || "")) };
          }),
          new Promise(resolve => { inspectionTimer = setTimeout(() => resolve({ inspection: "unavailable" }), 1000); }),
        ]);
      } catch { report.page = { inspection: "unavailable" }; }
      finally { clearTimeout(inspectionTimer); }
    }
    if (!report.result && report.state === "no_feed") {
      if (closed) report.state = "browser_closed";
      else if (report.feedResponses.some(entry => entry.state === "empty")) report.state = "empty";
      else if (report.feedResponses.length) report.state = "no_valid_feed";
      else if (report.page?.challengeVisible) report.state = "challenge";
      else if (report.page?.preloaderVisible) report.state = "page_stalled";
    }
    report.elapsedMs = Date.now() - started;
    onProgress({ phase: "observation_complete", state: report.state, elapsedMs: report.elapsedMs });
    return report;
  } finally {
    clearTimeout(timer);
    clearTimeout(graceTimer);
    clearInterval(progress);
    page.off("response", listen);
    page.off("close", close);
    page.off("request", requestStarted);
    page.off("requestfinished", requestFinished);
    page.off("requestfailed", requestFailed);
    page.off("pageerror", pageError);
    page.off("websocket", socketCreated);
    socketCleanup.forEach(remove => remove());
  }
}

async function cli() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("npm run scrape:browser -- [--headed] [--keep-open] [--channel chrome|msedge|firefox] [--timeout 45]\nFresh logged-out browser; observes only the site's own MO NBA responses.\nFirefox setup: npm run scrape:browser:install -- firefox\n--keep-open requires --headed, keeps observing after the deadline, and leaves the window open until you close it.\nReports and normalized odds go to .local/bet365-browser/. No cookies or token headers are saved.");
    return 0;
  }
  const options = { headed: false, keepOpen: false, channel: "chrome", timeout: 45 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--headed") options.headed = true;
    else if (args[i] === "--keep-open") options.keepOpen = true;
    else if (args[i] === "--channel") options.channel = args[++i];
    else if (args[i] === "--timeout") options.timeout = Number(args[++i]);
    else throw new Error("Unknown argument; use --help.");
  }
  if (!["chrome", "msedge", "firefox"].includes(options.channel) || !Number.isInteger(options.timeout) || options.timeout < 5 || options.timeout > 180) throw new Error("Use chrome/msedge/firefox and a timeout of 5–180 seconds.");
  if (options.keepOpen && !options.headed) throw new Error("--keep-open requires --headed.");
  let engines;
  try { engines = require("playwright-core"); } catch { throw new Error("Install the optional tool first; see tools/bet365-browser/README.md."); }
  const folder = path.join(ROOT, ".local/bet365-browser");
  fs.mkdirSync(folder, { recursive: true });
  // Remove a previous diagnostic result so a failed run cannot look successful.
  fs.rmSync(path.join(folder, "output.json"), { force: true });
  fs.rmSync(path.join(folder, "report.json"), { force: true });
  const browser = options.channel === "firefox"
    ? await engines.firefox.launch({ headless: !options.headed })
    : await engines.chromium.launch({ channel: options.channel, headless: !options.headed });
  try {
    const context = await browser.newContext({ locale: "en-US", acceptDownloads: false });
    const page = await context.newPage();
    console.log(`Observing bet365's MO NBA page in a fresh ${options.channel} session (${options.headed ? "visible" : "headless"}).`);
    if (options.keepOpen) console.log("The browser will stay open past the deadline. Close its window when you are finished inspecting it.");
    const report = await observe(page, { timeoutMs: options.timeout * 1000, settleMs: 5000, continueAfterDeadline: options.keepOpen,
      onProgress: status => console.log(JSON.stringify(status)) });
    const { result, ...safeReport } = report;
    if (result) {
      const { rows, ...summary } = result;
      safeReport.result = summary;
      fs.writeFileSync(path.join(folder, "output.json"), JSON.stringify(rows, null, 2) + "\n");
    }
    fs.writeFileSync(path.join(folder, "report.json"), JSON.stringify(safeReport, null, 2) + "\n");
    console.log(JSON.stringify(safeReport, null, 2));
    console.log("Diagnostic only: scheduled collection and public feed files were not updated.");
    if (options.keepOpen && !page.isClosed()) {
      console.log("Report saved. The browser is staying open for inspection; close its window to finish.");
      await page.waitForEvent("close", { timeout: 0 });
    }
    return result && result.normalizedMarkets > 0 && result.state === "ok" ? 0 : 1;
  } finally {
    console.log(JSON.stringify({ phase: "closing_browser", time: new Date().toISOString() }));
    await browser.close();
    console.log(JSON.stringify({ phase: "browser_closed", time: new Date().toISOString() }));
  }
}

module.exports = { feedRoute, classify, parseCapture, observe, PAGE_URL };
if (require.main === module) cli().then(code => { process.exitCode = code; }).catch(() => {
  console.error("Browser check could not start or finish. Use --help; ensure the optional dependencies, Python scraper dependencies, and selected browser are installed.");
  console.error("Optional tool setup: see tools/bet365-browser/README.md.");
  console.error("For the optional Firefox browser: npm run scrape:browser:install -- firefox");
  process.exitCode = 1;
});
