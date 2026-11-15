import "./BetSlab.css";
import Book from "../common/Book";
import CalcLink from "../calc/CalcLink";
import { Bet, BetOption, ScreenType } from "../../enums";
import { readableRate, isNegativeRate } from "./BetCard";
import { displayOdds, usePreferences } from "../common/etc/Preferences";

export default function BetSlab({
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
    <tbody className="bet-market">
      {bet.outcomes.map((outcome, index) => (
        <tr className={index === 0 ? "bet-row" : "bet-outcome-row"} key={index}>
          {index === 0 && (
            <>
              <td rowSpan={2}>
                <span className={`rate-pill ${isNegativeRate(bet.rate, betOption) ? "is-negative" : ""}`}>
                  {readableRate(bet.rate, betOption)}%
                </span>
              </td>
              <td className="event-cell" rowSpan={2}>
                <span className="sport-tag">{bet.sport.toUpperCase()}</span>
                <span className="event-name">{bet.event}</span>
                <span className="event-date">{bet.date}</span>
              </td>
              <td className="market-cell" rowSpan={2}>
                {bet.market}
              </td>
            </>
          )}
          <td className="paired-cell selection-name">{outcome.name}</td>
          <td className="paired-cell odds-value">{displayOdds(outcome.odds, oddsFormat)}</td>
          <td className="paired-cell books-cell">
            <div className="books-container">
              {outcome.books.map((book: string) => (
                <Book key={book} book={book} />
              ))}
            </div>
          </td>
          {index === 0 && (
            <td className="calculator-cell" rowSpan={2}>
              <CalcLink bet={bet} betOption={betOption} screenType={screenType} />
            </td>
          )}
        </tr>
      ))}
    </tbody>
  );
}
