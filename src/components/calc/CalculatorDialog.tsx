import { useId, useState } from "react";
import "./CalcLink.css";
import { Bet, BetOption } from "../../enums";
import { calcBetStats } from "../../Utils";
import { calculatorOutcomes } from "./calculator";
import CalcTab from "./CalcTab";
import ScenarioTab from "./ScenarioTab";
import Dialog from "../common/Dialog";
import Book from "../common/Book";

export default function CalculatorDialog({
  bet,
  betOption,
  onClose,
}: {
  bet: Bet;
  betOption: BetOption;
  onClose: () => void;
}) {
  const [amount_a, setAmount_a] = useState("");
  const [amount_b, setAmount_b] = useState("");
  const [conversion, setConversion] = useState("70");
  const [activeTab, setActiveTab] = useState(0);
  const tabsId = useId();
  const [first, second] = calculatorOutcomes(bet, betOption);
  const stats = calcBetStats(
    betOption,
    Number(amount_a),
    Number(amount_b),
    first.odds,
    second.odds,
    Number(conversion),
  );
  const hasAmounts = Number(amount_a) > 0 && Number(amount_b) > 0 && conversion !== "";

  return (
    <>
      <Dialog open={true} onClose={onClose} title="Bet calculator" className="calculator-dialog">
        <div className="calc-title-container">
          <span className="calc-strategy">{betOption.label}</span>
          <h3>{bet.event}</h3>
          <p>{bet.market}</p>
          <p className="calc-quote-note">Odds captured when opened.</p>
        </div>
        <div className="calc-tabs" role="tablist" aria-label="Calculator views">
          {["Stakes", "Outcomes"].map((name, index) => (
            <button
              type="button"
              role="tab"
              id={`${tabsId}-tab-${index}`}
              aria-controls={`${tabsId}-panel-${index}`}
              aria-selected={activeTab === index}
              tabIndex={activeTab === index ? 0 : -1}
              key={name}
              onClick={() => setActiveTab(index)}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - activeTab;
                  setActiveTab(next);
                  document.getElementById(`${tabsId}-tab-${next}`)?.focus();
                }
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`${tabsId}-panel-0`} aria-labelledby={`${tabsId}-tab-0`} hidden={activeTab !== 0}>
          <CalcTab
            betOption={betOption}
            amount_a={amount_a}
            setAmount_a={setAmount_a}
            amount_b={amount_b}
            setAmount_b={setAmount_b}
            conversion={conversion}
            setConversion={setConversion}
            bet_a={first.name}
            bet_b={second.name}
            odds_a={first.odds}
            odds_b={second.odds}
            books_a={first.books.map((book: string) => (
              <Book key={book} book={book} />
            ))}
            books_b={second.books.map((book: string) => (
              <Book key={book} book={book} />
            ))}
            stats={stats}
          />
        </div>
        <div role="tabpanel" id={`${tabsId}-panel-1`} aria-labelledby={`${tabsId}-tab-1`} hidden={activeTab !== 1}>
          {hasAmounts ? (
            <ScenarioTab
              betOption={betOption}
              amount_a={amount_a}
              amount_b={amount_b}
              bet_a={first.name}
              bet_b={second.name}
              stats={stats}
            />
          ) : (
            <p className="calc-empty">Enter a stake to compare the payout for each outcome.</p>
          )}
        </div>
      </Dialog>
    </>
  );
}
