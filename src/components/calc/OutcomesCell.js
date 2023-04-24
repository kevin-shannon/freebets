import "./OutcomesCell.css";

export default function OutcomesCell({ betA, betB, amountA, amountB }) {
  return (
    <div class="grid-container outcomes-container">
      <div class="grid-row">
        <div class="grid-cell outcome-cell">
          <span>{betA}</span>
        </div>
        <div class="grid-cell amount-cell">
          <span>{amountA}</span>
        </div>
      </div>
      <div class="grid-row">
        <div class="grid-cell outcome-cell">
          <span>{betB}</span>
        </div>
        <div class="grid-cell amount-cell">{amountB}</div>
      </div>
    </div>
  );
}
