import { createContext, useContext } from "react";
import { Bet, BetOption } from "../../enums";

export const CalculatorContext = createContext<((bet: Bet, option: BetOption) => void) | null>(null);

export function useCalculator() {
  const openCalculator = useContext(CalculatorContext);
  if (!openCalculator) throw new Error("CalculatorProvider is missing");
  return openCalculator;
}
