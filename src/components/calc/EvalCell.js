import "./EvalCell.css";

export default function EvalCell({ won, sunk, net, bonus }) {
  return (
    <div className="eval-cell-container">
      <table className="eval-cell-table">
        <tbody>
          <tr className="eval-cell-row">
            <td className="row-label won-label">
              <span>WON</span>
            </td>
            <td>{won}</td>
          </tr>
          <tr className="eval-cell-row">
            <td className="row-label sunk-label">
              <span>SUNK</span>
            </td>
            <td>{sunk}</td>
          </tr>
          <tr className="eval-cell-row">
            <td className="row-label net-label">
              <span>NET</span>
            </td>
            <td>{net}</td>
          </tr>
          {bonus ? (
            <tr className="eval-cell-row">
              <td className="row-label bonus-label">
                <span>BONUS</span>
              </td>
              <td>{bonus}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
