import "./EvalCell.css";

interface EvalCellProps {
  won: number;
  sunk: number;
  net: number;
  bonus?: string;
}

export default function EvalCell({ won, sunk, net, bonus }: EvalCellProps) {
  return (
    <div className="grid-container eval-container">
      <div className="grid-row">
        <div className="won-label row-label grid-cell">
          <span>WON</span>
        </div>
        <div className="grid-cell eval-val">{won}</div>
      </div>
      <div className="grid-row">
        <div className="grid-cell row-label sunk-label">
          <span>SUNK</span>
        </div>
        <div className="grid-cell eval-val">{sunk}</div>
      </div>
      <div className="grid-row">
        <div className="grid-cell row-label net-label">
          <span>NET</span>
        </div>
        <div className="grid-cell eval-val">{net}</div>
      </div>
      {bonus ? (
        <div className="grid-row">
          <div className="grid-cell row-label bonus-label">
            <span>BONUS</span>
          </div>
          <div className="grid-cell eval-val">{bonus}</div>
        </div>
      ) : null}
    </div>
  );
}
