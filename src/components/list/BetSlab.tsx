import React from "react";
import "./BetSlab.css";
import ImageList from "@mui/material/ImageList";
import Book from "../common/Book";
import CalcLink from "../calc/CalcLink";
import { Bet, BetType, BetOption, ScreenType } from "../../enums";

function readableRate(rate: number, betOption: BetOption) {
  if (betOption.value === BetType.ARBITRAGE) {
    return rate > 1 ? "+" + ((rate - 1) * 100).toFixed(1) : ((rate - 1) * 100).toFixed(1);
  } else {
    return (rate * 100).toFixed(1);
  }
}

interface BooksBlockProps {
  bet: Bet;
}

function BooksBlock({ bet }: BooksBlockProps) {
  const books_a: React.ReactNode[] = [];
  const books_b: React.ReactNode[] = [];
  bet.outcomes[0].books.forEach((book: string) => {
    books_a.push(<Book book={book} key={book} />);
  });
  bet.outcomes[1].books.forEach((book: string) => {
    books_b.push(<Book book={book} key={book} />);
  });

  return (
    <table className="books-block">
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

interface BetSlabProps {
  bet: Bet;
  betOption: BetOption;
  screenType: ScreenType;
}

export default function BetSlab({ bet, betOption, screenType }: BetSlabProps) {
  return (
    <tr className="bet-row">
      <td>{readableRate(bet.rate, betOption)}%</td>
      {screenType === "medium" ? null : <td>{bet.date}</td>}
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <td>
        <table className="bets-block">
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
        <CalcLink bet={bet} betOption={betOption} screenType={screenType} />
      </td>
    </tr>
  );
}
