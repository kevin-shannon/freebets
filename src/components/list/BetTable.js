import "./BetTable.css";
import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import BetCard from "./BetCard";
import BetSlab from "./BetSlab";
import { BetType } from "../../enums"

export default function PaginatedBets({ betsPerPage, bets, betType }) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * betsPerPage;
  const end = page * betsPerPage;
  const currentBets = bets.slice(start, end);
  const totalPages = Math.ceil(bets.length / betsPerPage);

  return (
    <Stack alignItems="center" spacing={4}>
      <BetTable bets={currentBets} betType={betType} />
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

function BetTable({ bets, betType }) {
  const rows = [];
  const rate = betType.value === BetType.ARBITRAGE ? "EV" : "Conversion";
  const { width } = useViewport();
  const breakpoint1 = 1100;
  const breakpoint2 = 850;
  const mode = width < breakpoint2 ? 2 : width < breakpoint1 ? 1 : 0;

  bets.forEach((bet) => {
    const key = bet.event + bet.market + bet.outcomes[0].name;
    rows.push(mode === 2 ? <BetCard bet={bet} betType={betType} mode={mode} key={key} /> : <BetSlab bet={bet} betType={betType} mode={mode} key={key} />);
  });

  return mode === 2 ? (
    <Stack>{rows}</Stack>
  ) : (
    <table className="bet-table">
      <thead>
        <tr>
          <th>{rate}</th>
          {mode === 1 ? null : <th>Date</th>}
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
