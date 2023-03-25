import BetRow from "./BetRow";
import React, { useState } from "react";
import Pagination from "./Pagination";

export default function PaginatedBets({ betsPerPage, maxPagesToShow, bets, betType }) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * betsPerPage;
  const end = page * betsPerPage;
  console.log(`Loading bets from ${start} to ${end}`);
  const currentBets = bets.slice(start, end);
  const totalPages = Math.ceil(bets.length / betsPerPage);

  const handlePageClick = (page) => {
    setPage(page);
  };

  return (
    <>
      <BetTable bets={currentBets} betType={betType} />
      <Pagination currentPage={page} totalPages={totalPages} maxPagesToShow={maxPagesToShow} onPageChange={handlePageClick} />
    </>
  );
}

function BetTable({ bets, betType }) {
  const rows = [];
  const rate = betType.value === "arbitrage" ? "EV" : "Conversion";
  bets.sort((a, b) => b.rate - a.rate);
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
