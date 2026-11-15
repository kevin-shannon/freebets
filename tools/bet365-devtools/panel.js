import { validateSettings } from "./publisher.js";

const status = document.getElementById("status");
const download = document.getElementById("download");
const recent = document.getElementById("recent");
const publishing = document.getElementById("publisher-status");
const stop = document.getElementById("stop");
let publisher, unsubscribe;

window.bindPublisher = controller => {
  unsubscribe?.();
  publisher = controller;
  unsubscribe = controller.subscribe(state => {
    download.disabled = !state.canDownload;
    stop.disabled = !state.enabled;
    status.textContent = state.canDownload ? "A public odds response is available to save." : "Waiting for a fresh MO NBA response.";
    const messages = {
      waiting: "Waiting for a response.", stopped: "Publishing is off.", starting: "Starting publisher…",
      refreshing: "Refreshing the NBA page…", waiting_for_fresh_response: "Waiting for a new response after navigation…",
      captured_unvalidated: "Public response captured.", publishing: "Publishing a fresh response…",
      published: `Published successfully${state.lastPublishedAt ? " at " + new Date(state.lastPublishedAt).toLocaleTimeString() : ""}.`,
      publish_failed: "Upload failed. Check the relay and connection. A new response will be tried on the next refresh.",
      relay_rejected: `Relay returned HTTP ${state.lastHttpStatus}. Check its browser-source setting and credentials.`,
      open_mo_nba_page: "Open the bet365 MO NBA page in this tab. Other pages are not refreshed or published.",
      capture_too_old: "The response was too old to publish. Waiting for a fresh one.",
      refresh_failed: "Could not refresh this tab. Keep the NBA page and DevTools open.",
      invalid_relay_response: "The relay response was not an accepted capture.",
    };
    publishing.textContent = (state.enabled ? "Publishing enabled. " : "") + (messages[state.status] || `Response state: ${state.status}.`);
    const records = state.recent.length ? state.recent : [{ state: "No matching requests yet." }];
    recent.replaceChildren(...records.map(record => {
      const item = document.createElement("li");
      item.textContent = `${record.time || ""} ${record.status ? "· HTTP " + record.status : ""} · ${record.state}${record.bytes !== undefined ? ` · ${record.bytes} bytes` : ""}`;
      return item;
    }));
  });
};

chrome.storage.local.get("relaySettings", saved => {
  if (!saved.relaySettings) return;
  const value = saved.relaySettings;
  document.getElementById("origin").value = value.origin || "";
  document.getElementById("relay-token").value = value.token || "";
  document.getElementById("client-id").value = value.clientId || "";
  document.getElementById("client-secret").value = value.clientSecret || "";
  document.getElementById("remember").checked = true;
});

document.getElementById("publisher-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!publisher) { publishing.textContent = "Panel is still initializing."; return; }
  let settings;
  try {
    settings = validateSettings({ origin: document.getElementById("origin").value.trim(), token: document.getElementById("relay-token").value,
      clientId: document.getElementById("client-id").value.trim(), clientSecret: document.getElementById("client-secret").value });
  } catch (error) { publishing.textContent = error.message; return; }
  // Request only this configured origin, directly from the user's button click.
  const granted = await chrome.permissions.request({ origins: [settings.origin + "/*"] });
  if (!granted) { publishing.textContent = "Relay access permission was not granted."; return; }
  if (document.getElementById("remember").checked) chrome.storage.local.set({ relaySettings: settings });
  else chrome.storage.local.remove("relaySettings");
  await publisher.start(settings);
});
stop.addEventListener("click", () => publisher?.stop());
window.addEventListener("unload", () => unsubscribe?.());

download.addEventListener("click", () => {
  const capture = publisher?.getCapture();
  if (!capture) return;
  const url = URL.createObjectURL(new Blob([capture], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "bet365-mo-nba-capture.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
