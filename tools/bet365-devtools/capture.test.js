import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { describeRequest, decodeFeed } from "./capture.js";
import browserTool from "../bet365-browser/check.cjs";

const sample = fs.readFileSync(new URL("../../src/scrape/tests/fixtures/bet365-nba.txt", import.meta.url), "utf8");
const query = new URLSearchParams({ lid: "32", zid: "0", pd: "#AC#B18#C20604387#D48#E1453#F10#", cid: "198", cgid: "3", ctid: "198" });
const url = `https://www.mo.bet365.com/contentdata/matchmarketscontentapi/markets?${query}`;
const entry = value => ({ request: { url: value, method: "GET", headers: [{ name: "Cookie", value: "private-cookie" }] }, response: { status: 200 } });

test("capture scope agrees with the browser observer and excludes credentials from reports", () => {
  assert.equal(describeRequest(entry(url)).state, "candidate");
  for (const value of [url, url + "&token=private-token", url + "&zid=0", url.replace("zid=0", "zid=1")]) {
    assert.equal(describeRequest(entry(value)).state === "candidate", browserTool.feedRoute(value) === "verified");
    assert(!JSON.stringify(describeRequest(entry(value))).includes("private-"));
  }
  assert.equal(describeRequest(entry("https://example.com/account")).state, "irrelevant");
  assert.equal(describeRequest({ request: { url, method: "POST" } }).state, "irrelevant");
});

test("only successful feed responses become candidates", () => {
  const request = entry(url);
  request.response.status = 403;
  assert.equal(describeRequest(request).state, "http_error");
});

test("a complete known empty schedule can replace old odds", () => {
  assert.equal(decodeFeed("F|CL;ID=18;|EV;L3=NBA;|MG;ID=1453;SY=cmx;|MA;ID=M0;|").state, "captured_unvalidated");
});

test("captures plain and base64 pipe responses without claiming parser validation", () => {
  for (const [text, encoding] of [[sample, ""], [Buffer.from(sample).toString("base64"), "base64"]]) {
    const result = decodeFeed(text, encoding);
    assert.equal(result.state, "captured_unvalidated");
    assert.equal(result.text, sample);
    assert.equal(result.bytes, Buffer.byteLength(sample));
  }
});

test("empty, HTML, malformed and oversized bodies are not downloadable odds", () => {
  for (const [body, encoding, state] of [["", "", "empty"], ["<html>challenge</html>", "", "not_odds"],
    ["F|CL;ID=18;|", "", "not_odds"], ["not base64!", "base64", "unreadable"],
    ["anything", "unknown", "unsupported_encoding"], ["x".repeat(8 * 1024 * 1024 + 1), "", "oversized"]]) {
    const result = decodeFeed(body, encoding);
    assert.equal(result.state, state);
    assert.equal(result.text, undefined);
  }
});

test("publisher grants no relay host access until the user chooses an origin", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["storage"]);
  for (const field of ["host_permissions", "content_scripts", "background"]) assert.equal(manifest[field], undefined);
  assert(manifest.optional_host_permissions.includes("https://*/*"));
  assert(fs.existsSync(new URL(manifest.devtools_page, import.meta.url)));
});
