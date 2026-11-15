export const sportsbookCatalog = [
  { id: "draftkings", name: "DraftKings", icon: "draftkings.png", hasOdds: true },
  { id: "fanduel", name: "FanDuel", icon: "fanduel.png", hasOdds: true },
  { id: "betmgm", name: "BetMGM", icon: "betmgm.png", hasOdds: true },
  { id: "fanatics", name: "Fanatics", icon: "fanatics.jpg", hasOdds: false },
  { id: "caesars", name: "Caesars", icon: "caesars.png", hasOdds: true },
  { id: "bet365", name: "bet365", icon: "bet365.jpg", hasOdds: process.env.REACT_APP_ENABLE_BET365 === "true" },
  { id: "thescorebet", name: "theScore Bet", icon: "thescorebet.png", hasOdds: false },
  { id: "hardrockbet", name: "Hard Rock Bet", icon: "hardrockbet.png", hasOdds: false },
  { id: "circasports", name: "Circa Sports", icon: "circasports.png", hasOdds: false },
  { id: "betrivers", name: "BetRivers", icon: "betrivers.png", hasOdds: false },
] as const;

export type SportsbookId = (typeof sportsbookCatalog)[number]["id"];
export function getSportsbook(id: string) {
  return sportsbookCatalog.find((book) => book.id === id);
}
