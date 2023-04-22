import "./EvalCell.css";

export default function EvalCell({ won, sunk, net, bonus }) {
  return (
    <div class="grid-container">
      <div class="grid-row">
        <div class="grid-cell row-label won-label">
          <span>WON</span>
        </div>
        <div class="grid-cell">{won}</div>
      </div>
      <div class="grid-row">
        <div class="grid-cell row-label sunk-label">
          <span>SUNK</span>
        </div>
        <div class="grid-cell">{sunk}</div>
      </div>
      <div class="grid-row">
        <div class="grid-cell row-label net-label">
          <span>NET</span>
        </div>
        <div class="grid-cell">{net}</div>
      </div>
      {bonus ? (
        <div class="grid-row">
          <div class="grid-cell row-label bonus-label">
            <span>BONUS</span>
          </div>
          <div class="grid-cell">{bonus}</div>
        </div>
      ) : null}
    </div>
  );
}
