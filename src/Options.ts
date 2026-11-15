import { BetOption, BookOption, SportOption, BetType, BookType, SportType } from "./enums";
import { getActiveSportsbooks } from "./data/bookAvailability";
import { StateCode } from "./data/states";
import { sportsbookCatalog } from "./data/sportsbooks";

export const bet_type_options: BetOption[] = [
  { value: BetType.ARBITRAGE, label: "Arbitrage" },
  { value: BetType.PLAYTHROUGH, label: "Playthrough" },
  { value: BetType.FREEBET, label: "Free Bet" },
  { value: BetType.RISKFREE, label: "Risk Free" },
];

export const book_options: BookOption[] = sportsbookCatalog
  .filter((book) => book.hasOdds)
  .map((book) => ({ value: book.id as BookType, label: book.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const book_options_all: BookOption[] = [{ value: BookType.ALL, label: "All" }, ...book_options];

export function bookOptionsForState(state: StateCode | ""): BookOption[] {
  if (!state) return book_options_all;
  const available = new Set<string>(getActiveSportsbooks(state).map((book) => book.id));
  const connected = book_options.filter((book) => available.has(book.value));
  return connected.length ? [{ value: BookType.ALL, label: "All" }, ...connected] : [];
}

export function restrictBookSelection(selection: BookOption[], options: BookOption[]): BookOption[] {
  if (selection.some((book) => book.value === BookType.ALL)) return options;
  return selection.filter((book) => options.some((option) => option.value === book.value));
}

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
