import BetRow from "./BetRow";
import React, { useState } from "react";
import Pagination from "./Pagination";

export default function PaginatedBets({ betsPerPage, maxPagesToShow, bets, betType }) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * betsPerPage;
  const end = page * betsPerPage;
  const currentBets = bets.slice(start, end);
  const totalPages = Math.ceil(bets.length / betsPerPage);

  return (
    <>
      <BetTable bets={currentBets} betType={betType} />
      <Pagination currentPage={page} totalPages={totalPages} maxPagesToShow={maxPagesToShow} onPageChange={setPage} />
    </>
  );
}

function BetTable({ bets, betType }) {
  const rows = [];
  const rate = betType.value === "arbitrage" ? "EV" : "Conversion";
  bets.forEach((bet) => {
    rows.push(<BetRow bet={bet} key={bet.event + bet.market} />);
  });

  return (
    <table>
      <thead>
        <tr>
          <th>{rate}</th>
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
