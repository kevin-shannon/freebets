import "./BetSlab.css";
import ImageList from "@mui/material/ImageList";
import Book from "../common/Book.js";
import CalcLink from "../common/CalcLink";

function readableRate(rate, betType) {
  if (betType === "arbitrage") {
    return rate > 1 ? "+" + ((rate - 1) * 100).toFixed(1) : ((rate - 1) * 100).toFixed(1);
  } else {
    return (rate * 100).toFixed(1);
  }
}

function BooksBlock({ bet }) {
  const books_a = [];
  const books_b = [];
  bet.outcomes[0].books.forEach((book) => {
    books_a.push(<Book book={book} key={book} />);
  });
  bet.outcomes[1].books.forEach((book) => {
    books_b.push(<Book book={book} key={book} />);
  });

  return (
    <table>
      <tbody>
        <tr>
          <td className="odds-value">{bet.outcomes[0].odds > 0 ? "+" + bet.outcomes[0].odds : bet.outcomes[0].odds}</td>
          <td>
            <div className="books-container">
              <ImageList style={{ margin: 0, gap: 2 }} cols={Math.min(4, books_a.length)}>
                {books_a}
              </ImageList>
            </div>
          </td>
        </tr>
        <tr style={{ borderTop: "1px solid #cccccc" }}>
          <td className="odds-value">{bet.outcomes[1].odds > 0 ? "+" + bet.outcomes[1].odds : bet.outcomes[1].odds}</td>
          <td>
            <div className="books-container">
              <ImageList style={{ margin: 0, gap: 2 }} cols={Math.min(4, books_b.length)}>
                {books_b}
              </ImageList>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function BetSlab({ bet, betType, mode }) {
  return (
    <tr className="bet-row">
      <td>{readableRate(bet.rate, betType.value)}%</td>
      {mode === 1 ? null : <td>{bet.date}</td>}
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
        <CalcLink bet={bet} mode={mode} />
      </td>
    </tr>
  );
}
