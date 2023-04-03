import "./BetTable.css";
import BetRow from "./BetRow";
import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

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

function BetTable({ bets, betType }) {
  const rows = [];
  const rate = betType.value === "arbitrage" ? "EV" : "Conversion";
  bets.forEach((bet) => {
    rows.push(<BetRow bet={bet} betType={betType} key={bet.event + bet.market + bet.outcomes[0].name} />);
  });

  return (
    <table className="bet-table">
      <thead>
        <tr>
          <th>{rate}</th>
          <th>Date</th>
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
