import { ReactNode, useCallback, useState } from "react";
import { Bet, BetOption } from "../../enums";
import { CalculatorContext } from "./CalculatorContext";
import CalculatorDialog from "./CalculatorDialog";

export default function CalculatorProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<{ bet: Bet; option: BetOption } | null>(null);
  const openCalculator = useCallback((bet: Bet, option: BetOption) => {
    // Hold the selected quote independently of feed updates, ranking, and pagination.
    setSelection({ bet, option });
  }, []);

  return (
    <CalculatorContext.Provider value={openCalculator}>
      {children}
      {selection && (
        <CalculatorDialog bet={selection.bet} betOption={selection.option} onClose={() => setSelection(null)} />
      )}
    </CalculatorContext.Provider>
  );
}
