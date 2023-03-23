import BetRow from "./BetRow";

export default function BetTable({ bets, betType }) {
  const rows = [];
  const rate = betType.value === "arbitrage" ? "EV" : "Conversion";
  if (betType.value === "arbitrage") {
    bets.sort((a, b) => b.ev - a.ev);
  } else {
    bets.sort((a, b) => b.conversion - a.conversion);
  }
  bets.forEach((bet) => {
    rows.push(<BetRow bet={bet} betType={betType} key={bet.event + bet.market} />);
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
