import "./BetCard.css";
import Book from "../common/Book";
import ImageList from "@mui/material/ImageList";
import Stack from "@mui/material/Stack";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/free-solid-svg-icons";

export function readableRate(rate, betType) {
  if (betType === "arbitrage") {
    return rate > 1 ? "+" + ((rate - 1) * 100).toFixed(1) : ((rate - 1) * 100).toFixed(1);
  } else {
    return (rate * 100).toFixed(1);
  }
}

function OutcomeBlock({ outcome }) {
  const books = [];
  outcome.books.forEach((book, index) => {
    books.push(<Book book={book} key={index} />);
  });

  return (
    <div>
      <Stack>
        <span className="card-outcome-name">{outcome.name}</span>
        <span className="card-outcome-odds">{outcome.odds > 0 ? "+" + outcome.odds : outcome.odds}</span>
        <ImageList className="card-outcome-books" style={{ margin: "auto", paddingTop: 2, gap: 2 }} cols={Math.min(4, books.length)}>
          {books}
        </ImageList>
      </Stack>
    </div>
  );
}

export default function BetCard({ bet, betType }) {
  let outcomes = [];
  bet.outcomes.forEach((outcome, index) => {
    outcomes.push(
      <td className="card-outcome" key={index}>
        <OutcomeBlock outcome={outcome} />
      </td>
    );
  });
  return (
    <div className="betcard">
      <Stack className="betcard-info">
        <div className="rate-container">
          <span className="card-rate">{readableRate(bet.rate, betType.value)}%</span>
          <FontAwesomeIcon className="calc" size="2x" icon={faCalculator} />
        </div>
        <span className="card-event">{bet.event}</span>
        <span className="card-market">{bet.market}</span>
      </Stack>
      <table className="betcard-outcomes">
        <tbody>
          <tr className="outcomes-row">{outcomes}</tr>
        </tbody>
      </table>
    </div>
  );
}
