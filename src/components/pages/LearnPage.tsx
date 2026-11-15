import "./Pages.css";

export default function LearnPage() {
  return (
    <div className="learn-page">
      <div className="section-introduction">
        <h1>Learn</h1>
        <p>Start with the basics, then put the comparison tools to work.</p>
      </div>
      <div className="learn-layout">
        <nav className="learn-nav" aria-label="Guide sections">
          <a href="#/learn?section=matched-betting">What is matched betting?</a>
          <a href="#/learn?section=first-comparison">Your first comparison</a>
          <a href="#/learn?section=strategies">The four strategies</a>
          <a href="#/learn?section=odds">Reading the odds</a>
          <a href="#/learn?section=terms">Useful terms</a>
        </nav>
        <div className="learn-content">
          <section id="learn-matched-betting">
            <h2>What is matched betting?</h2>
            <p>
              Matched betting pairs bets on opposing outcomes, usually at different sportsbooks. A hedge is the second
              bet that offsets the first. With a promotion, the aim is to understand how much of the offer’s value
              remains after accounting for both bets.
            </p>
            <p>
              Freebets compares quoted prices and calculates stakes. You place and settle your bets at the sportsbooks
              themselves; Freebets does not hold your money or place bets for you.
            </p>
          </section>
          <section id="learn-first-comparison">
            <h2>Your first comparison</h2>
            <ol className="guide-steps">
              <li>
                <strong>Pick the strategy that matches your offer.</strong> A cash bet and a bonus bet do not have the
                same payout rules.
              </li>
              <li>
                <strong>Select your books and a sport.</strong> Use books you can actually access, and check their
                current location and offer requirements.
              </li>
              <li>
                <strong>Read both selections.</strong> The event, market, and line must describe opposing outcomes of
                the same bet. Moneyline, spread, and total markets are different.
              </li>
              <li>
                <strong>Open the calculator.</strong> Enter your first stake, review the matching stake, and use
                Outcomes to see the possible payouts. The calculator keeps the odds captured when you opened it.
              </li>
              <li>
                <strong>Check the sportsbook before placing a bet.</strong> Prices can change. Confirm the displayed
                odds, promotional eligibility, and settlement rules at each book.
              </li>
            </ol>
            <a className="text-link" href="#/bets">
              Try a comparison <span aria-hidden="true">→</span>
            </a>
          </section>
          <section id="learn-strategies">
            <h2>The four strategies</h2>
            <div className="strategy-list">
              <article>
                <h3>Arbitrage</h3>
                <p>
                  Compare the prices on opposing outcomes across books. The EV percentage describes the quoted pairing’s
                  return; a negative value means the pairing is not profitable at those prices.
                </p>
              </article>
              <article>
                <h3>Playthrough</h3>
                <p>
                  Compare paired bets when working through an offer’s wagering requirements. Which bets count toward
                  those requirements depends on the promotion’s terms.
                </p>
              </article>
              <article>
                <h3>Free Bet</h3>
                <p>
                  Model a bonus stake separately from cash. For example, DraftKings excludes the bonus stake from
                  winnings, which changes the hedge calculation. Always check the terms of your specific offer.{" "}
                  <a
                    href="https://support.draftkings.com/dk/en-us/what-is-a-bonus-bet?id=kb_article_view&sysparm_article=KB0010380"
                    target="_blank"
                    rel="noreferrer"
                  >
                    DraftKings bonus bet guide ↗
                  </a>
                </p>
              </article>
              <article>
                <h3>Risk Free</h3>
                <p>
                  Model a qualifying cash bet and an estimated conversion of a replacement free bet if it loses. This
                  strategy label does not mean every loss is refunded in cash; the actual offer determines the
                  reimbursement.
                </p>
              </article>
            </div>
          </section>
          <section id="learn-odds">
            <h2>Reading the odds</h2>
            <div className="odds-examples">
              <div>
                <strong>+150</strong>
                <p>American odds: a $100 cash stake wins $150 in profit if successful, plus the original stake.</p>
              </div>
              <div>
                <strong>−110</strong>
                <p>American odds: a $110 cash stake wins $100 in profit if successful, plus the original stake.</p>
              </div>
              <div>
                <strong>2.50</strong>
                <p>Decimal odds: the total cash payout is 2.5 times the stake, including the returned stake.</p>
              </div>
            </div>
            <p>
              Switch between American, decimal, and implied-probability formats in Preferences. Implied probability is
              calculated from the price; it is not a prediction of the result.{" "}
              <a href="https://support.fanduel.com/s/article/Sports-Betting-Terms" target="_blank" rel="noreferrer">
                FanDuel betting terms ↗
              </a>
            </p>
          </section>
          <section id="learn-terms">
            <h2>Useful terms</h2>
            <dl className="term-list">
              <div>
                <dt>Stake</dt>
                <dd>The amount placed on a bet.</dd>
              </div>
              <div>
                <dt>Payout</dt>
                <dd>The amount returned if a bet wins. Whether it includes the stake depends on the bet’s terms.</dd>
              </div>
              <div>
                <dt>Net</dt>
                <dd>What remains after subtracting the cash staked from the payouts.</dd>
              </div>
              <div>
                <dt>Conversion</dt>
                <dd>The estimated share of a bonus bet’s face value retained after the hedge.</dd>
              </div>
              <div>
                <dt>Push</dt>
                <dd>
                  A tied result under the market’s settlement rules. Cash and promotional stakes can be treated
                  differently.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
