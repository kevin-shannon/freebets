import "./CalcLink.css";
import { Bet, BetOption, ScreenType } from "../../enums";
import { ReactComponent as Calculator } from "../../icons/calculator.svg";
import { useCalculator } from "./CalculatorContext";

export default function CalcLink({ bet, betOption }: { bet: Bet; betOption: BetOption; screenType: ScreenType }) {
  const openCalculator = useCalculator();
  return (
    <button
      type="button"
      className="icon-button calc-button"
      aria-label={`Calculate ${bet.event}, ${bet.market}`}
      aria-haspopup="dialog"
      onClick={() => openCalculator(bet, betOption)}
    >
      <Calculator aria-hidden="true" />
    </button>
  );
}
