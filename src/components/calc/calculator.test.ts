import { calculatorOutcomes } from "./calculator";
import { Bet, BetType } from "../../enums";

const bet: Bet = {
  sport: "nba",
  event: "Home vs Away",
  market: "Moneyline",
  date: "Today",
  outcomes: [
    { name: "Home", odds: -200, books: ["caesars"] },
    { name: "Away", odds: 150, books: ["fanduel"] },
  ],
  rate: 0.5,
};

test.each([BetType.FREEBET, BetType.RISKFREE])(
  "%s assigns the promotion to the selection matching the conversion",
  (value) => {
    const [promotion, hedge] = calculatorOutcomes(bet, { value, label: value });
    expect(promotion).toEqual({ name: "Away", odds: 150, books: ["fanduel"] });
    expect(hedge).toEqual({ name: "Home", odds: -200, books: ["caesars"] });
  },
);

test("playthrough uses its weighted rate when assigning selections", () => {
  const [first] = calculatorOutcomes({ ...bet, rate: -0.1 }, { value: BetType.PLAYTHROUGH, label: "Playthrough" });
  expect(first.name).toBe("Home");
  expect(first.books).toEqual(["caesars"]);
});
