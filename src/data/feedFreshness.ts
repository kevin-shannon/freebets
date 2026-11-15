export interface BrowserCaptureStatus {
  state: string;
  source?: string;
  captureObservedAt?: string;
  captureMaxAgeSeconds?: number;
}

export function browserCaptureFresh(status: BrowserCaptureStatus | undefined, now: number): boolean {
  if (!status || !["ok", "partial", "no_events"].includes(status.state) || status.source !== "browser_capture") return false;
  const observed = Date.parse(status.captureObservedAt || "");
  const limit = status.captureMaxAgeSeconds;
  return Number.isFinite(observed) && typeof limit === "number" && limit > 0 && limit <= 300 &&
    now - observed >= -5000 && now - observed < limit * 1000;
}

export function removeExpiredBrowserOdds(rows: any[], status: BrowserCaptureStatus | undefined, now: number): any[] {
  if (status?.state !== "no_events" && browserCaptureFresh(status, now)) return rows;
  if (!rows.some(row => row.outcomes.some((outcome: any) => Object.values(outcome.books).some(books => (books as string[]).includes("bet365"))))) return rows;
  return rows.map(row => ({ ...row, outcomes: row.outcomes.map((outcome: any) => ({
    ...outcome,
    books: Object.fromEntries(Object.entries(outcome.books).flatMap(([price, books]) => {
      const remaining = (books as string[]).filter(book => book !== "bet365");
      return remaining.length ? [[price, remaining]] : [];
    })),
  })) }));
}
