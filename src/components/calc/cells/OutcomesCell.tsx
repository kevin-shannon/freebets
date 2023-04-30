import "./OutcomesCell.css";
import { formatMoneyNumber } from "../../../Utils";

interface OutcomesCellProps {
  betLabel: string;
  bet_a: string;
  bet_b: string;
  amount_a: string;
  amount_b: string;
}

export default function OutcomesCell({ betLabel, bet_a, amount_a, bet_b, amount_b }: OutcomesCellProps) {
  return (
    <table className="outcomes-table">
      <thead>
        <tr className="outcomes-table-header">
          <td>{betLabel.toUpperCase()}</td>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr className="outcomes-table-row">
          <td>
            <div className="outcomes-table-data">
              <span>{bet_a}</span>
            </div>
          </td>
          <td>
            <div className="outcomes-table-data">
              <span>{formatMoneyNumber(Number(amount_a), false)}</span>
            </div>
          </td>
        </tr>
        <tr className="outcomes-table-row">
          <td>
            <div className="outcomes-table-data">
              <span>{bet_b}</span>
            </div>
          </td>
          {amount_b === "X" ? (
            <td>
              <div className="outcomes-table-data">
                <span>$X</span>
              </div>
            </td>
          ) : (
            <td>
              <div className="outcomes-table-data">
                <span>{formatMoneyNumber(Number(amount_b), false)}</span>
              </div>
            </td>
          )}
        </tr>
      </tbody>
    </table>
  );
}
