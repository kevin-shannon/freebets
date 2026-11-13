import { BetOption, BookOption, SportOption, BetType, BookType, SportType } from "./enums";

export const bet_type_options: BetOption[] = [
  { value: BetType.ARBITRAGE, label: "Arbitrage" },
  { value: BetType.PLAYTHROUGH, label: "Playthrough" },
  { value: BetType.FREEBET, label: "Free Bet" },
  { value: BetType.RISKFREE, label: "Risk Free" },
];

export const book_options: BookOption[] = [
  { value: BookType.BETMGM, label: "BetMGM" },
  { value: BookType.CAESARS, label: "Caesars" },
  { value: BookType.DRAFTKINGS, label: "DraftKings" },
  { value: BookType.FANDUEL, label: "FanDuel" },
];

export const book_options_all: BookOption[] = [{ value: BookType.ALL, label: "All" }, ...book_options];

export function normalizeBookSelection(selection: BookOption[]): BookOption[] {
  if (!Array.isArray(selection)) return book_options_all;
  const selected = new Set(selection.map((option) => option?.value));
  if (selected.has(BookType.ALL)) return book_options_all;
  return book_options.filter((option) => selected.has(option.value));
}

export const sport_options: SportOption[] = [
  { value: SportType.BASKETBALL, label: "Basketball" },
  { value: SportType.BASEBALL, label: "Baseball" },
  { value: SportType.HOCKEY, label: "Hockey" },
  { value: SportType.FOOTBALL, label: "Football" },
  { value: SportType.TENNIS, label: "Tennis" },
];

export const sport_options_all: SportOption[] = [{ value: SportType.ALL, label: "All" }, ...sport_options];
