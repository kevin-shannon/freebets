import { createPublisher } from "./publisher.js";

const publisher = createPublisher({
  getPageUrl: () => new Promise(resolve => chrome.devtools.inspectedWindow.eval("location.href", (url, error) => resolve(error ? "" : url))),
  reload: () => chrome.devtools.inspectedWindow.reload({ ignoreCache: true }),
});
chrome.devtools.network.onRequestFinished.addListener(entry => publisher.handle(entry));
chrome.devtools.network.onNavigated.addListener(() => publisher.navigated());
chrome.devtools.panels.create("Freebets odds", "", "panel.html", panel => {
  panel.onShown.addListener(panelWindow => {
    const connect = () => panelWindow.bindPublisher(publisher);
    if (typeof panelWindow.bindPublisher === "function") connect();
    else panelWindow.addEventListener("load", connect, { once: true });
  });
});
