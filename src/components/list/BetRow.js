import "./BetRow.css";
import BooksBlock from "./BooksBlock";
import BetCard from "./BetCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/free-solid-svg-icons";

export function readableRate(rate, betType) {
  if (betType === "arbitrage") {
    return rate > 1 ? "+" + ((rate - 1) * 100).toFixed(1) : ((rate - 1) * 100).toFixed(1);
  } else {
    return (rate * 100).toFixed(1);
  }
}

export default function BetRow({ bet, betType, mode }) {
  return mode === 1 ? (
    <tr className="bet-row">
      <td>{readableRate(bet.rate, betType.value)}%</td>
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <td>
        <table>
          <tbody>
            <tr>
              <td>{bet.outcomes[0].name}</td>
            </tr>
            <tr>
              <td>{bet.outcomes[1].name}</td>
            </tr>
          </tbody>
        </table>
      </td>
      <td>
        <BooksBlock bet={bet} />
      </td>
      <td>
        <FontAwesomeIcon className="calc-link" size="2x" icon={faCalculator} />
      </td>
    </tr>
  ) : mode === 0 ? (
    <tr className="bet-row">
      <td>{readableRate(bet.rate, betType.value)}%</td>
      <td>{bet.date}</td>
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <td>
        <table>
          <tbody>
            <tr>
              <td>{bet.outcomes[0].name}</td>
            </tr>
            <tr>
              <td>{bet.outcomes[1].name}</td>
            </tr>
          </tbody>
        </table>
      </td>
      <td>
        <BooksBlock bet={bet} />
      </td>
      <td>
        <FontAwesomeIcon className="calc-link" size="2x" icon={faCalculator} />
      </td>
    </tr>
  ) : (
    <BetCard bet={bet} betType={betType} />
  );
}
