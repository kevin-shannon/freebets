import React from "react";
import "./BetCard.css";
import Book from "../common/Book";
import ImageList from "@mui/material/ImageList";
import Stack from "@mui/material/Stack";
import CalcLink from "../calc/CalcLink";
import { Bet, BetType, BetOption, ScreenType } from "../../enums";

export function readableRate(rate: number, betOption: BetOption) {
  if (betOption.value === BetType.ARBITRAGE) {
    return rate > 1 ? "+" + ((rate - 1) * 100).toFixed(1) : ((rate - 1) * 100).toFixed(1);
  } else {
    return (rate * 100).toFixed(1);
  }
}

interface OutcomeBlockProps {
  outcome: { name: string, odds: number, books: string[] };
}

function OutcomeBlock({ outcome }: OutcomeBlockProps) {
  const books: React.ReactNode[] = [];
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

interface BetCardProps {
  bet: Bet;
  betOption: BetOption;
  screenType: ScreenType;
}

export default function BetCard({ bet, betOption, screenType }: BetCardProps) {
  let outcomes: React.ReactNode[] = [];
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
          <span className="card-rate">{readableRate(bet.rate, betOption)}%</span>
          <CalcLink bet={bet} betOption={betOption} screenType={screenType} />
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
