import BetsBlock from "./BetsBlock";
import BooksBlock from "./BooksBlock";

export default function BetRow({ bet }) {
  return (
    <tr className="bet-row">
      <td>{(bet.rate * 100).toFixed(1)}%</td>
      <td>{bet.date}</td>
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <td>
        <BetsBlock bet={bet} />
      </td>
      <td>
        <BooksBlock bet={bet} />
      </td>
    </tr>
  );
}
