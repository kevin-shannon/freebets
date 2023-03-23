import BetsBlock from "./BetsBlock";
import BooksBlock from "./BooksBlock";

export default function BetRow({ bet, betType }) {
  return (
    <tr>
      <td>{betType.value === "arbitrage" ? bet.ev : bet.conversion}</td>
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
