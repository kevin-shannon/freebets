import "./BetTable.css";
import { useEffect, useState } from "react";
import BetCard from "./BetCard";
import BetSlab from "./BetSlab";
import Pagination from "./Pagination";
import { BetType, BetOption, Bet } from "../../enums";

export default function PaginatedBets({
  betsPerPage,
  bets,
  betOption,
}: {
  betsPerPage: number;
  bets: Bet[];
  betOption: BetOption;
}) {
  const [page, setPage] = useState(1);
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 1000px)").matches);
  const totalPages = Math.max(1, Math.ceil(bets.length / betsPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * betsPerPage;
  const currentBets = bets.slice(start, start + betsPerPage);
  const rate =
    betOption.value === BetType.ARBITRAGE
      ? "EV"
      : betOption.value === BetType.PLAYTHROUGH
        ? "Weighted EV"
        : "Conversion";
  useEffect(() => {
    setPage((value) => Math.min(value, totalPages));
  }, [totalPages]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1000px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="results">
      {!bets.length ? (
        <div className="empty-state">
          <h3>No matching markets</h3>
          <p>Try another sport, select more books, or reset your filters.</p>
        </div>
      ) : (
        <>
          {compact ? (
            <div className="bet-cards">
              {currentBets.map((bet) => (
                <BetCard
                  key={`${bet.event}-${bet.market}-${bet.outcomes[0].name}-${bet.date}`}
                  bet={bet}
                  betOption={betOption}
                  screenType="small"
                />
              ))}
            </div>
          ) : (
            <div className="table-container">
              <table className="bet-table">
                <caption className="sr-only">
                  Matched markets, sorted by {rate}. Odds and sportsbooks for both sides of each bet.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">{rate}</th>
                    <th scope="col">Event</th>
                    <th scope="col">Market</th>
                    <th scope="col">Selections</th>
                    <th scope="col">Odds</th>
                    <th scope="col">Books</th>
                    <th scope="col">
                      <span className="sr-only">Calculator</span>
                    </th>
                  </tr>
                </thead>
                {currentBets.map((bet) => (
                  <BetSlab
                    key={`${bet.event}-${bet.market}-${bet.outcomes[0].name}-${bet.date}`}
                    bet={bet}
                    betOption={betOption}
                    screenType="large"
                  />
                ))}
              </table>
            </div>
          )}
          <div className="results-footer">
            <span>
              Showing {start + 1}–{Math.min(start + betsPerPage, bets.length)} of {bets.length.toLocaleString()}
            </span>
            <Pagination total={totalPages} page={currentPage} setPage={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
