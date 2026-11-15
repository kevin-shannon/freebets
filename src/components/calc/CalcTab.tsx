import { Dispatch, ReactNode, SetStateAction, useId } from "react";
import "./CalcTab.css";
import CurrencyInput from "react-currency-input-field";
import { calcBetStats, calcHedge, formatMoneyNumber } from "../../Utils";
import { BetOption, BetType } from "../../enums";
import { displayOdds, usePreferences } from "../common/etc/Preferences";

interface CalcTabProps {
  betOption: BetOption;
  amount_a: string;
  setAmount_a: Dispatch<SetStateAction<string>>;
  amount_b: string;
  setAmount_b: Dispatch<SetStateAction<string>>;
  conversion: string;
  setConversion: Dispatch<SetStateAction<string>>;
  bet_a: string;
  bet_b: string;
  odds_a: number;
  odds_b: number;
  books_a: ReactNode[];
  books_b: ReactNode[];
  stats: ReturnType<typeof calcBetStats>;
}
export default function CalcTab({
  betOption,
  amount_a,
  setAmount_a,
  amount_b,
  setAmount_b,
  conversion,
  setConversion,
  bet_a,
  bet_b,
  odds_a,
  odds_b,
  books_a,
  books_b,
  stats,
}: CalcTabProps) {
  const { oddsFormat } = usePreferences();
  const id = useId();
  const editableHedge = betOption.value === BetType.ARBITRAGE || betOption.value === BetType.PLAYTHROUGH;
  const labelA =
    betOption.value === BetType.FREEBET
      ? "Free bet amount"
      : betOption.value === BetType.RISKFREE
        ? "Risk free bet amount"
        : "First stake";
  const labelB = editableHedge ? "Second stake" : "Calculated hedge";
  const hasAmounts = Number(amount_a) > 0 && Number(amount_b) > 0 && conversion !== "";
  const changeA = (value: string | undefined) => {
    setAmount_a(value || "");
    setAmount_b(
      value && conversion !== "" ? calcHedge(betOption, Number(value), odds_a, odds_b, Number(conversion)) : "",
    );
  };
  const changeB = (value: string | undefined) => {
    if (!editableHedge) return;
    setAmount_b(value || "");
    setAmount_a(value ? calcHedge(betOption, Number(value), odds_b, odds_a, Number(conversion)) : "");
  };

  return (
    <div className="stake-calculator">
      <div className="stake-grid">
        {[
          {
            name: bet_a,
            odds: odds_a,
            books: books_a,
            label: labelA,
            value: amount_a,
            change: changeA,
            readonly: false,
          },
          {
            name: bet_b,
            odds: odds_b,
            books: books_b,
            label: labelB,
            value: amount_b,
            change: changeB,
            readonly: !editableHedge,
          },
        ].map((side, index) => (
          <div className="stake-side" key={index}>
            <div className="books-container">{side.books}</div>
            <h4>{side.name}</h4>
            <div className="calc-odds">
              <span>Odds</span>
              <strong>{displayOdds(side.odds, oddsFormat)}</strong>
            </div>
            <label className="input-label" htmlFor={`${id}-stake-${index}`}>
              {side.label}
            </label>
            <CurrencyInput
              id={`${id}-stake-${index}`}
              className="calc-input"
              prefix="$"
              placeholder="$0"
              inputMode="numeric"
              allowDecimals={false}
              allowNegativeValue={false}
              disableAbbreviations
              value={side.value}
              onValueChange={side.change}
              maxLength={4}
              readOnly={side.readonly}
            />
          </div>
        ))}
      </div>
      {betOption.value === BetType.RISKFREE && (
        <div className="conversion-container">
          <label className="input-label" htmlFor={`${id}-conversion`}>
            Estimated free bet conversion
          </label>
          <div className="conversion-full-input">
            <input
              id={`${id}-conversion`}
              className="conversion-input"
              value={conversion}
              type="number"
              min="0"
              max="100"
              inputMode="numeric"
              onChange={(event) => {
                const value = event.target.value;
                if (/^\d{0,3}$/.test(value) && Number(value) <= 100) {
                  setConversion(value);
                  setAmount_b(
                    value !== "" ? calcHedge(betOption, Number(amount_a), odds_a, odds_b, Number(value)) : "",
                  );
                }
              }}
            />
            <span>%</span>
          </div>
          <p>If the first bet loses, this estimates the value of the replacement free bet.</p>
        </div>
      )}
      {hasAmounts ? (
        <div className={`profit-box ${stats.profit < 0 ? "is-negative" : ""}`} aria-live="polite">
          <span>Estimated {stats.profit < 0 ? "loss" : "profit"}</span>
          <strong>{formatMoneyNumber(stats.profit)}</strong>
          <small>{stats.perc.toFixed(2)}% return</small>
        </div>
      ) : (
        <p className="calc-empty">Enter a stake to calculate the matching bet.</p>
      )}
    </div>
  );
}
