export default function OutcomesCell({ betA, betB, amountA, amountB }) {
  return (
    <table>
      <tbody>
        <tr>
          <td>{betA}</td>
          <td>{amountA}</td>
        </tr>
        <tr>
          <td>{betB}</td>
          <td>{amountB}</td>
        </tr>
      </tbody>
    </table>
  );
}
