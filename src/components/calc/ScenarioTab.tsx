import "./ScenarioTab.css";
import { BetOption, BetType } from "../../enums";
import { calcBetStats, formatMoneyNumber } from "../../Utils";

interface ScenarioTabProps {
  betOption: BetOption;
  amount_a: string;
  amount_b: string;
  bet_a: string;
  bet_b: string;
  stats: ReturnType<typeof calcBetStats>;
}
export default function ScenarioTab({ betOption, amount_a, bet_a, bet_b, stats }: ScenarioTabProps) {
  const riskFree = betOption.value === BetType.RISKFREE;
  return (
    <div className="scenario-grid">
      {[
        { name: bet_a, won: stats.won_a, net: stats.net_a },
        { name: bet_b, won: stats.won_b, net: stats.net_b },
      ].map((side, index) => (
        <section className="scenario-card" key={index}>
          <p className="scenario-eyebrow">IF THIS SIDE WINS</p>
          <h4>{side.name}</h4>
          <dl>
            <div>
              <dt>Payout</dt>
              <dd>{side.won}</dd>
            </div>
            <div>
              <dt>Cash staked</dt>
              <dd>{stats.sunk}</dd>
            </div>
            <div className="scenario-net">
              <dt>Net</dt>
              <dd className={side.net.startsWith("-") ? "is-negative" : ""}>{side.net}</dd>
            </div>
          </dl>
          {riskFree && index === 1 && (
            <div className="scenario-bonus">
              <p>Plus a {formatMoneyNumber(Number(amount_a), false)} replacement free bet.</p>
              <p>
                Estimated net after conversion: <strong>{stats.net_b_2}</strong>
              </p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
