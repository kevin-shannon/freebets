import { BetOption, BookOption, SportOption, BetType, BookType, SportType } from "./enums";

export const bet_type_options: BetOption[] = [
  { value: BetType.ARBITRAGE, label: "Arbitrage" },
  { value: BetType.PLAYTHROUGH, label: "Playthrough" },
  { value: BetType.FREEBET, label: "Free Bet" },
  { value: BetType.RISKFREE, label: "Risk Free" },
];

export const book_options: BookOption[] = [
  { value: BookType.BETMGM, label: "BetMgm" },
  { value: BookType.CAESARS, label: "Caesars" },
  { value: BookType.DRAFTKINGS, label: "Draftkings" },
  { value: BookType.FANDUEL, label: "Fanduel" },
  { value: BookType.POINTSBET, label: "Pointsbet" },
  { value: BookType.SUPERBOOK, label: "Superbook" },
  { value: BookType.UNIBET, label: "Unibet" },
];

export const book_options_all: BookOption[] = [{ value: BookType.ALL, label: "All" }, ...book_options];

export const sport_options: SportOption[] = [
  { value: SportType.NBA, label: "NBA" },
  { value: SportType.MLB, label: "MLB" },
  { value: SportType.NHL, label: "NHL" },
  { value: SportType.NFL, label: "NFL" },
  { value: SportType.COLLEGE_BASKETBALL, label: "College Basketball" },
  { value: SportType.COLLEGE_FOOTBALL, label: "College Football" },
  { value: SportType.TENNIS, label: "Tennis" },
];
