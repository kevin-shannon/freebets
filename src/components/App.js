import './App.css';
import Book from './Book.js'

function App() {
  return <FilterableBetTable bets={BETS} />;
}

function BetRow({ bet }) {
  return (
    <tr>
      <td>{bet.ev}</td>
      <td>{bet.conversion}</td>
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <td><BetsBlock bet={bet} /></td>
      <td><BooksBlock bet={bet} /></td>
    </tr>
  );
}

function BooksBlock({ bet }) {
  const books_a = [];
  const books_b = [];
  bet.outcomes[0].books.forEach((book) => {
    books_a.push(
      <Book
        book={book}
        key={book} />
    )
  })
  bet.outcomes[1].books.forEach((book) => {
    books_b.push(
      <Book
        book={book}
        key={book} />
    )
  })

  return (
    <table>
      <tbody>
        <tr>
          <td>{bet.outcomes[0].odds}</td>
          <td>{books_a}</td>
        </tr>
        <tr>
          <td>{bet.outcomes[1].odds}</td>
          <td>{books_b}</td>
        </tr>
      </tbody>
    </table>
  )
}

function BetsBlock({ bet }) {
  return (
    <table>
      <tbody>
        <tr>
          <td>{bet.outcomes[0].name}</td>
        </tr>
        <tr>
          <td>{bet.outcomes[1].name}</td>
        </tr>
      </tbody>
    </table>
  )
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
          <th>Conversion</th>
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
  {sport: 'nhl', event: 'ANA Ducks vs VAN Canucks', market: 'Total: 10.0', outcomes: Array(2), ev: 95.36, conversion: 48.10, outcomes: [{name: 'Over', odds: 850, books: ['unibet']}, {name: 'Under', odds: -1667, books: ['unibet']}]},
  {sport: 'nhl', event: 'BOS Bruins vs BUF Sabres', market: 'Moneyline', outcomes: Array(2), ev: 97.09, conversion: 56.74, outcomes: [{name: 'BUF Sabres', odds: 160, books: ['draftkings']}, {name: 'BOS Bruins', odds: -182, books: ['fanduel']}]},
  {sport: 'nhl', event: 'CBJ Blue Jackets vs VGK Golden Knights', market: 'Total: 5.5', outcomes: Array(2), ev: 95.43, conversion: 52, outcomes: [{name: 'Under', odds: 143, books: ['unibet']}, {name: 'Over', odds: -175, books: ['betmgm', 'unibet']}]},
  {sport: 'nhl', event: 'STL Blues vs WPG Jets', market: 'Spread: WPG Jets: -1.0', outcomes: Array(2), ev: 95.4, conversion: 50.94, outcomes: [{name: 'WPG Jets -1.0', odds: 135, books: ['unibet']}, {name: 'STL Blues +1.0', odds: -165, books: ['unibet']}]}
];

export default App;