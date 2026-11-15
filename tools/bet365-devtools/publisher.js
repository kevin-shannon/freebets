import { describeRequest, decodeFeed } from "./capture.js";

export function relayOrigin(value) {
  const url = new URL(value);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
      url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname) ||
      url.hostname.endsWith("bet365.com") || url.hostname === "api.americanwagering.com") throw new Error("Use your HTTPS relay origin, without a path or credentials.");
  return url.origin;
}

export function isNbaPage(value) {
  try {
    const url = new URL(value);
    return url.origin === "https://www.mo.bet365.com" && /^#\/AC\/B18\/C20604387\/D48\/E1453\/F10\/?$/.test(url.hash);
  } catch { return false; }
}

export function validateSettings(value) {
  const settings = { origin: relayOrigin(value.origin), token: value.token || "", clientId: value.clientId || "", clientSecret: value.clientSecret || "" };
  if (!/^[\x21-\x7e]{32,512}$/.test(settings.token)) throw new Error("Enter the relay token (32–512 characters).");
  if (Boolean(settings.clientId) !== Boolean(settings.clientSecret)) throw new Error("Enter both Cloudflare service-token fields.");
  if ([settings.clientId, settings.clientSecret].some(value => /[\r\n]/.test(value) || value.length > 4096)) throw new Error("Invalid service-token fields.");
  return settings;
}

export function createPublisher({ getPageUrl, reload, send = fetch, now = Date.now,
  repeat = setInterval, cancelRepeat = clearInterval, later = setTimeout, cancelLater = clearTimeout } = {}) {
  let config = null, capture = null, generation = 0, publishing = null, refreshTimer = null;
  const listeners = new Set();
  const state = { enabled: false, status: "waiting", lastCaptureAt: null, lastPublishedAt: null, lastHttpStatus: null, nextRefreshAt: null, recent: [] };
  const snapshot = () => ({ ...state, canDownload: Boolean(capture), recent: state.recent.map(record => ({ ...record })) });
  const notify = () => listeners.forEach(listener => listener(snapshot()));
  const record = value => { state.recent.unshift({ time: new Date(now()).toLocaleTimeString(), ...value }); state.recent.splice(12); };
  const stop = () => {
    state.enabled = false;
    if (refreshTimer !== null) cancelRepeat(refreshTimer);
    refreshTimer = null;
    state.nextRefreshAt = null;
    publishing?.abort();
    publishing = null;
    generation++;
    state.status = "stopped";
    notify();
  };
  const refresh = async () => {
    if (!state.enabled) return;
    try {
      const url = await getPageUrl();
      if (!state.enabled) return;
      if (!isNbaPage(url)) { state.status = "open_mo_nba_page"; notify(); return; }
      state.nextRefreshAt = new Date(now() + 60000).toISOString();
      state.status = "refreshing";
      notify();
      await reload();
    } catch { state.status = "refresh_failed"; notify(); }
  };
  const start = async settings => {
    const validated = validateSettings(settings);
    stop();
    config = validated;
    state.enabled = true;
    state.status = "starting";
    refreshTimer = repeat(refresh, 60000);
    notify();
    // Never upload a previously saved body. A reload must produce a fresh response.
    await refresh();
  };
  const publish = async (text, observedAt) => {
    if (!state.enabled || publishing) return;
    if (!Number.isFinite(observedAt) || now() - observedAt > 15000 || observedAt - now() > 5000) {
      state.status = "capture_too_old"; notify(); return;
    }
    const current = generation;
    const controller = new AbortController();
    publishing = controller;
    const timeout = later(() => controller.abort(), 20000);
    const headers = { "Content-Type": "text/plain;charset=UTF-8", "Authorization": "Bearer " + config.token,
      "X-Freebets-Observed-At": new Date(observedAt).toISOString(), "X-Freebets-Trace-Id": crypto.randomUUID() };
    if (config.clientId) {
      headers["CF-Access-Client-Id"] = config.clientId;
      headers["CF-Access-Client-Secret"] = config.clientSecret;
    }
    state.status = "publishing";
    notify();
    try {
      if (!isNbaPage(await getPageUrl())) { state.status = "open_mo_nba_page"; return; }
      if (current !== generation || !state.enabled) return;
      const response = await send(config.origin + "/bet365/capture", {
        method: "POST", body: text, headers, credentials: "omit", cache: "no-store", redirect: "error", signal: controller.signal,
      });
      if (current !== generation || !state.enabled) return;
      state.lastHttpStatus = response.status;
      if (!response.ok) { state.status = "relay_rejected"; return; }
      const result = await response.json();
      if (current !== generation || !state.enabled) return;
      if (result.state !== "accepted") { state.status = "invalid_relay_response"; return; }
      state.lastPublishedAt = new Date(now()).toISOString();
      state.status = "published";
    } catch {
      if (current === generation && state.enabled) state.status = "publish_failed";
    } finally {
      cancelLater(timeout);
      if (publishing === controller) publishing = null;
      notify();
    }
  };
  return {
    start, stop, refresh, snapshot,
    subscribe(listener) { listeners.add(listener); listener(snapshot()); return () => listeners.delete(listener); },
    getCapture() { return capture; },
    navigated() {
      generation++;
      publishing?.abort();
      publishing = null;
      capture = null;
      state.status = state.enabled ? "waiting_for_fresh_response" : "waiting";
      notify();
    },
    handle(entry) {
      const request = describeRequest(entry);
      if (request.state === "irrelevant") return;
      const current = generation;
      if (request.state !== "candidate") { record(request); state.status = request.state; notify(); return; }
      entry.getContent((content, encoding) => {
        if (current !== generation) return;
        const { text, ...result } = decodeFeed(content, encoding);
        record({ ...request, ...result });
        if (text) {
          capture = text;
          state.lastCaptureAt = new Date(now()).toISOString();
          state.status = "captured_unvalidated";
          if (state.enabled) void publish(text, Date.parse(entry.startedDateTime));
        } else state.status = result.state;
        notify();
      });
    },
  };
}
