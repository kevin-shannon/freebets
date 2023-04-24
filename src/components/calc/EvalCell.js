import "./EvalCell.css";

export default function EvalCell({ won, sunk, net, bonus }) {
  return (
    <div class="grid-container eval-container">
      <div class="grid-row">
        <div class="won-label row-label grid-cell">
          <span>WON</span>
        </div>
        <div class="grid-cell eval-val">{won}</div>
      </div>
      <div class="grid-row">
        <div class="grid-cell row-label sunk-label">
          <span>SUNK</span>
        </div>
        <div class="grid-cell eval-val">{sunk}</div>
      </div>
      <div class="grid-row">
        <div class="grid-cell row-label net-label">
          <span>NET</span>
        </div>
        <div class="grid-cell eval-val">{net}</div>
      </div>
      {bonus ? (
        <div class="grid-row">
          <div class="grid-cell row-label bonus-label">
            <span>BONUS</span>
          </div>
          <div class="grid-cell eval-val">{bonus}</div>
        </div>
      ) : null}
    </div>
  );
}
