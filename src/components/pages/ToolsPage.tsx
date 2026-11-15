import { ReactComponent as Calculator } from "../../icons/calculator.svg";
import "./Pages.css";

export default function ToolsPage() {
  return (
    <div className="tools-page">
      <div className="section-introduction">
        <h1>Tools</h1>
        <p>A place for tracking your bets and working through the numbers. These tools are planned.</p>
      </div>
      <div className="tool-grid">
        <article className="tool-card">
          <div className="tool-card-top">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4v16h16M8 15v-4m5 4V7m5 8v-6" />
            </svg>
            <span className="planned-badge">Planned</span>
          </div>
          <h2>Bet tracker</h2>
          <p>
            Track money in and out of each sportsbook, log your bets and odds, record wins and losses, and see your net
            result.
          </p>
          <ul>
            <li>Balances, deposits, and withdrawals by book</li>
            <li>Stakes, odds, and results for each bet</li>
            <li>A clear view of your net profit or loss</li>
          </ul>
        </article>
        <article className="tool-card">
          <div className="tool-card-top">
            <Calculator aria-hidden="true" />
            <span className="planned-badge">Planned</span>
          </div>
          <h2>Strategy calculators</h2>
          <p>
            Work through arbitrage, playthrough, free bet, and risk free scenarios with your own odds, independently of
            a listed market.
          </p>
          <p>For now, you can use the calculator next to any market on Bets.</p>
          <a className="text-link" href="#/bets">
            Go to Bets <span aria-hidden="true">→</span>
          </a>
        </article>
      </div>
    </div>
  );
}
