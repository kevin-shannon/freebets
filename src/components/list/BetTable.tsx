import "./BetTable.css";
import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import BetCard from "./BetCard";
import BetSlab from "./BetSlab";
import { BetType, ScreenType, BetOption, Bet } from "../../enums";

interface PaginatedBetsProps {
  betsPerPage: number;
  bets: Bet[];
  betOption: BetOption;
}

export default function PaginatedBets({ betsPerPage, bets, betOption }: PaginatedBetsProps) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * betsPerPage;
  const end = page * betsPerPage;
  const currentBets = bets.slice(start, end);
  const totalPages = Math.ceil(bets.length / betsPerPage);

  return (
    <Stack alignItems="center" spacing={4}>
      <BetTable bets={currentBets} betOption={betOption} />
      <Pagination count={totalPages} onChange={(_, value) => setPage(value)} shape="rounded" />
    </Stack>
  );
}

const useViewport = () => {
  const [width, setWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const handleWindowResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  return { width };
};

interface BetTableProps {
  bets: Bet[];
  betOption: BetOption;
}

function BetTable({ bets, betOption }: BetTableProps) {
  const rows: React.ReactNode[] = [];
  const rate = betOption.value === BetType.ARBITRAGE ? "EV" : "Conversion";
  const { width } = useViewport();
  const breakpoint1 = 1100;
  const breakpoint2 = 850;
  const screenType: ScreenType = width < breakpoint2 ? "small" : width < breakpoint1 ? "medium" : "large";

  bets.forEach((bet) => {
    const key = bet.event + bet.market + bet.outcomes[0].name + bet.date;
    rows.push(
      screenType === "small" ? (
        <BetCard bet={bet} betOption={betOption} screenType={screenType} key={key} />
      ) : (
        <BetSlab bet={bet} betOption={betOption} screenType={screenType} key={key} />
      )
    );
  });

  return screenType === "small" ? (
    <Stack>{rows}</Stack>
  ) : (
    <table className="bet-table">
      <thead>
        <tr>
          <th>{rate}</th>
          {screenType === "medium" ? null : <th>Date</th>}
          <th>Event</th>
          <th>Market</th>
          <th>Bets</th>
          <th>Books</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}
