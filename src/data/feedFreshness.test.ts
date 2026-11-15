import { browserCaptureFresh, removeExpiredBrowserOdds } from "./feedFreshness";

const now = Date.parse("2026-11-15T08:00:00Z");
const fresh = { state: "ok", source: "browser_capture", captureObservedAt: "2026-11-15T07:59:00Z", captureMaxAgeSeconds: 120 };
const rows = [{ outcomes: [{ name: "Home", books: { "-110": ["bet365", "fanduel"], "100": ["bet365"] } },
  { name: "Away", books: { "110": ["draftkings"] } }] }];

test("browser odds expire at their source age limit even without a feed refresh", () => {
  expect(browserCaptureFresh(fresh, now)).toBe(true);
  expect(browserCaptureFresh(fresh, now + 60000)).toBe(false);
  expect(removeExpiredBrowserOdds(rows, fresh, now)).toBe(rows);
  const result = removeExpiredBrowserOdds(rows, fresh, now + 60000);
  expect(result[0].outcomes[0].books).toEqual({ "-110": ["fanduel"] });
  expect(result[0].outcomes[1].books).toEqual({ "110": ["draftkings"] });
  expect(rows[0].outcomes[0].books["-110"]).toEqual(["bet365", "fanduel"]);
  expect(removeExpiredBrowserOdds(rows, { ...fresh, state: "no_events" }, now)[0].outcomes[0].books).toEqual({ "-110": ["fanduel"] });
});

test("missing, invalid, future or failed source metadata cannot make browser odds fresh", () => {
  for (const status of [undefined, { ...fresh, state: "stale" }, { ...fresh, source: "direct" },
    { ...fresh, captureObservedAt: "bad" }, { ...fresh, captureObservedAt: "2026-11-15T09:00:00Z" },
    { ...fresh, captureMaxAgeSeconds: 10000 }]) expect(browserCaptureFresh(status, now)).toBe(false);
});
