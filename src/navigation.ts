export type Page = "home" | "bets" | "tools" | "learn";

export function pageFromHash(hash: string): Page {
  const path = hash.split("?")[0].replace(/^#/, "").replace(/\/$/, "");
  return path === "/bets" ? "bets" : path === "/tools" ? "tools" : path === "/learn" ? "learn" : "home";
}
