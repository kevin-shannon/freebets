const EXPECTED = { lid: "32", zid: "0", pd: "#AC#B18#C20604387#D48#E1453#F10#", cid: "198", cgid: "3", ctid: "198" };
const MAX_BYTES = 8 * 1024 * 1024;

export function describeRequest(entry) {
  let url;
  try { url = new URL(entry.request.url); } catch { return { state: "irrelevant" }; }
  if (url.origin !== "https://www.mo.bet365.com" || url.pathname !== "/contentdata/matchmarketscontentapi/markets" || entry.request.method !== "GET") return { state: "irrelevant" };
  const status = entry.response?.status;
  const verified = Object.entries(EXPECTED).every(([key, value]) => {
    const values = url.searchParams.getAll(key);
    return values.length === 1 && values[0] === value;
  }) && [...url.searchParams.keys()].every(key => key in EXPECTED);
  // Reports contain no request URL, header, cookie, or token values.
  return { state: !verified ? "unverified_route" : status === 200 ? "candidate" : "http_error", status };
}

export function decodeFeed(content, encoding = "") {
  if (typeof content !== "string") return { state: "unreadable" };
  if (content.length > MAX_BYTES * 2) return { state: "oversized" };
  let text;
  try {
    text = encoding === "base64"
      ? new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(content), c => c.charCodeAt(0)))
      : encoding ? null : content;
  } catch { return { state: "unreadable" }; }
  if (text === null) return { state: "unsupported_encoding" };
  text = text.replace(/^\uFEFF/, "");
  const bytes = new TextEncoder().encode(text).length;
  if (!bytes) return { state: "empty", bytes: 0 };
  if (bytes > MAX_BYTES) return { state: "oversized", bytes };
  if (!text.startsWith("F|CL;")) return { state: "not_odds", bytes };
  const records = text.split("|").slice(1).map(record => {
    const [kind, ...fields] = record.split(";");
    return [kind, Object.fromEntries(fields.filter(field => field.includes("=")).map(field => {
      const index = field.indexOf("=");
      return [field.slice(0, index), field.slice(index + 1)];
    }))];
  });
  if (!records.some(([kind, fields]) => kind === "CL" && fields.ID === "18") ||
      !records.some(([kind, fields]) => kind === "EV" && fields.L3 === "NBA") ||
      !records.some(([kind, fields]) => kind === "MG" && fields.ID === "1453" && fields.SY === "cmx")) return { state: "not_odds", bytes };
  // Capture only; Python remains the authority for event and market validation.
  return { state: "captured_unvalidated", bytes, text };
}
