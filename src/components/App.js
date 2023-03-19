import './App.css';

function App() {
  return <FilterableBetTable bets={BETS} />;
}

function BetRow({ bet }) {
  return (
    <tr>
      <td>{bet.ev}</td>
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <tr>
        <td>{bet.outcomes[0].name}</td>
        <td>{bet.outcomes[0].odds}</td>
      </tr>
      <tr>
        <td>{bet.outcomes[1].name}</td>
        <td>{bet.outcomes[1].odds}</td>
      </tr>
    </tr>
  );
}

function BetTable({ bets }) {
  const rows = [];
  bets.forEach((bet) => {
    rows.push(
      <BetRow
        bet={bet}
        key={bet.event + bet.market} />
    );
  });

  return (
    <table>
      <thead>
        <tr>
          <th>EV</th>
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

function FilterableBetTable({ bets }) {
  return (
    <div>
      <BetTable bets={bets} />
    </div>
  );
}

const BETS = [
  {ev: 97, conversion: 70, event: "OTT Senators vs TOR Maple Leafs", market: "Moneyline", outcomes: [{"name": "TOR Maple Leafs", "odds": -400, "books": ["unibet"]}, {"name": "OTT Senators", "odds": 333, "books": ["superbook"]}]},
  {ev: 95, conversion: 70, event: "CGY Flames vs DAL Stars", market: "Total 3.5", outcomes: [{"name": "Over", "odds": -110, "books": ["betmgm", "pointsbet"]}, {"name": "Under", "odds": 100, "books": ["draftkings"]}]},
  {ev: 93, conversion: 69, event: "MTL Canadiens vs TB Lightning", market: "Team Total: MTL Canadiens: 4.5", outcomes: [{"name": "Under", "odds": -200, "books": ["betmgm"]}, {"name": "Over", "odds": 170, "books": ["fanduel"]}]},
  {ev: 91, conversion: 69, event: "LA Kings vs VAN Canucks", market: "Spread: LA Kings: -2.5", outcomes: [{"name": "VAN Canucks +2.5", "odds": -250, "books": ["draftkings"]}, {"name": "LA Kings -2.5", "odds": 200, "books": ["betmgm"]}]}
];

export default App;