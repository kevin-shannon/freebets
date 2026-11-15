import { getActiveSportsbooks, onlineSportsbookCoverage, stateBookAvailability } from "./bookAvailability";
import { states, StateCode } from "./states";
import { sportsbookCatalog } from "./sportsbooks";
import { bookOptionsForState, book_options_all, restrictBookSelection } from "../Options";
import { BookType } from "../enums";
import { filterBets } from "../Utils";
import { BetType } from "../enums";
import { isOnlineBettingState, onlineBettingStates } from "./onlineBettingStates";

test.each<[StateCode, string[]]>([
  ["FL", ["hardrockbet"]],
  ["CT", ["draftkings", "fanduel", "fanatics"]],
  ["DE", ["betrivers"]],
  ["NV", ["betmgm", "caesars", "circasports"]],
  ["MO", ["draftkings", "fanduel", "betmgm", "fanatics", "caesars", "bet365", "thescorebet", "circasports"]],
  ["AR", ["draftkings"]],
  ["CA", []],
  ["MS", []],
  ["WA", []],
])("%s lists only the researched online operators", (state, expected) => {
  expect(getActiveSportsbooks(state).map((book) => book.id)).toEqual(expected);
});

test("every state and DC has a dated record and every operator has source links", () => {
  expect(Object.keys(stateBookAvailability)).toHaveLength(states.length);
  expect(sportsbookCatalog).toHaveLength(10);
  for (const [state] of states) {
    expect(stateBookAvailability[state].verifiedAt).toBe("2026-11-14");
    expect(stateBookAvailability[state].sources.length).toBeGreaterThan(0);
    expect(new Set(stateBookAvailability[state].books).size).toBe(stateBookAvailability[state].books.length);
  }
  for (const book of sportsbookCatalog) {
    expect(onlineSportsbookCoverage[book.id].sources.every((url) => url.startsWith("https://"))).toBe(true);
  }
});

test("comparison choices include only connected feeds available in the selected state", () => {
  expect(bookOptionsForState("CT").map((book) => book.value)).toEqual([
    BookType.ALL,
    BookType.DRAFTKINGS,
    BookType.FANDUEL,
  ]);
  expect(bookOptionsForState("FL")).toEqual([]);
  expect(bookOptionsForState("CA")).toEqual([]);
  expect(bookOptionsForState("")).toEqual(book_options_all);
});

test("comparison book choices follow the connected catalog without enabling upcoming feeds", () => {
  const connected = sportsbookCatalog.filter((book) => book.hasOdds).map((book) => book.id).sort();
  expect(book_options_all.filter((book) => book.value !== BookType.ALL).map((book) => book.value).sort()).toEqual(connected);
  expect(book_options_all.some((book) => book.value === BookType.BET365)).toBe(process.env.REACT_APP_ENABLE_BET365 === "true");
  for (const book of sportsbookCatalog) expect(Object.values(BookType)).toContain(book.id);
});

test("no state shows the full operator catalog and all connected comparison choices", () => {
  expect(getActiveSportsbooks("").map((book) => book.id)).toEqual(sportsbookCatalog.map((book) => book.id));
  expect(bookOptionsForState("")).toEqual(book_options_all);
});

test("the selector excludes unavailable online markets without confusing operator coverage with legality", () => {
  for (const state of ["CA", "TX", "AL", "MS", "MT", "WA", "WI"]) expect(isOnlineBettingState(state)).toBe(false);
  for (const state of ["MO", "NJ", "NV", "FL", "RI", "DC"]) expect(isOnlineBettingState(state)).toBe(true);
  expect(onlineBettingStates).toHaveLength(32);
  expect(getActiveSportsbooks("RI")).toEqual([]);
});

test("switching states restricts selections without destroying the saved book preference", () => {
  const selection = [{ value: BookType.CAESARS, label: "Caesars" }];
  expect(restrictBookSelection(selection, bookOptionsForState("CT"))).toEqual([]);
  expect(restrictBookSelection(selection, bookOptionsForState("MO"))).toEqual(selection);
  expect(restrictBookSelection(book_options_all, bookOptionsForState("CT"))).toEqual(bookOptionsForState("CT"));
  expect(restrictBookSelection([], bookOptionsForState("MO"))).toEqual([]);
});

test("unavailable books sharing the same price do not leak into displayed outcomes", () => {
  const bets = filterBets(
    [
      {
        sport: "nba",
        event: "Home vs Away",
        market: "Moneyline",
        start: new Date(Date.now() + 3600000).toISOString(),
        outcomes: [
          { name: "Home", books: { "150": ["draftkings", "betmgm"] } },
          { name: "Away", books: { "-200": ["fanduel", "caesars"] } },
        ],
      },
    ],
    { value: BetType.ARBITRAGE },
    ["draftkings", "fanduel"],
    ["draftkings", "fanduel"],
    null,
    null,
    false,
    false,
    false,
  );
  expect(bets).toHaveLength(1);
  expect(bets[0].outcomes[0].books).toEqual(["draftkings"]);
  expect(bets[0].outcomes[1].books).toEqual(["fanduel"]);
});
