import React from "react";
import "./OutcomesCell.css";

interface OutcomesCellProps {
  bet_a: string;
  bet_b: string;
  amount_a: string;
  amount_b: string;
}

export default function OutcomesCell({ bet_a, amount_a, bet_b, amount_b }: OutcomesCellProps) {
  return (
    <div className="grid-container outcomes-container">
      <div className="grid-row">
        <div className="grid-cell outcome-cell">
          <span>{bet_a}</span>
        </div>
        <div className="grid-cell amount-cell">
          <span>{amount_a}</span>
        </div>
      </div>
      <div className="grid-row">
        <div className="grid-cell outcome-cell">
          <span>{bet_b}</span>
        </div>
        <div className="grid-cell amount-cell">{amount_b}</div>
      </div>
    </div>
  );
}
