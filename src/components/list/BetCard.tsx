import "./BetCard.css";
import Book from "../common/Book";
import CalcLink from "../calc/CalcLink";
import { Bet, BetType, BetOption, ScreenType } from "../../enums";
import { displayOdds, usePreferences } from "../common/etc/Preferences";

export function readableRate(rate: number, betOption: BetOption) {
  const value = betOption.value === BetType.ARBITRAGE ? (rate - 1) * 100 : rate * 100;
  return `${value > 0 && betOption.value === BetType.ARBITRAGE ? "+" : ""}${value.toFixed(1)}`;
}
export function isNegativeRate(rate: number, betOption: BetOption) {
  return betOption.value === BetType.ARBITRAGE ? rate < 1 : rate < 0;
}
export default function BetCard({
  bet,
  betOption,
  screenType,
}: {
  bet: Bet;
  betOption: BetOption;
  screenType: ScreenType;
}) {
  const { oddsFormat } = usePreferences();
  return (
    <article className="betcard">
      <div className="card-topline">
        <span className="sport-tag">{bet.sport.toUpperCase()}</span>
        <span className={`rate-pill ${isNegativeRate(bet.rate, betOption) ? "is-negative" : ""}`}>
          {readableRate(bet.rate, betOption)}%{" "}
          <small>
            {betOption.value === BetType.ARBITRAGE ? "EV" : betOption.value === BetType.PLAYTHROUGH ? "W. EV" : "conv."}
          </small>
        </span>
      </div>
      <h3 className="card-event">{bet.event}</h3>
      <span className="event-date">{bet.date}</span>
      <div className="card-market-row">
        <span className="card-market">{bet.market}</span>
        <CalcLink bet={bet} betOption={betOption} screenType={screenType} />
      </div>
      <div className="card-outcomes">
        {bet.outcomes.map((outcome, index) => (
          <div className="card-outcome" key={index}>
            <span className="card-outcome-name">{outcome.name}</span>
            <span className="card-outcome-odds">{displayOdds(outcome.odds, oddsFormat)}</span>
            <div className="books-container">
              {outcome.books.map((book: string) => (
                <Book key={book} book={book} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
