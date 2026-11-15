import { Bet, BetOption, BetType } from "../../enums";
import { computeConversion, computeEv, computePlaythrough } from "../../Utils";

// Keep each selection's name, odds, and books together when assigning the hedge.
export function calculatorOutcomes(bet: Bet, option: BetOption) {
  const evaluate =
    option.value === BetType.ARBITRAGE
      ? computeEv
      : option.value === BetType.PLAYTHROUGH
        ? computePlaythrough
        : computeConversion;
  const [first, second] = bet.outcomes;
  return Math.abs(evaluate(first.odds, second.odds) - bet.rate) <=
    Math.abs(evaluate(second.odds, first.odds) - bet.rate)
    ? ([first, second] as const)
    : ([second, first] as const);
}
