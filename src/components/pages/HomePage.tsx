import StateSelector, { StateSelectorProps } from "../common/StateSelector";
import { book_options } from "../../Options";
import "./Pages.css";

export default function HomePage(props: StateSelectorProps) {
  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-introduction">
          <h1>
            A clearer view of the odds.
            <br />
            <span>Find your next matched bet.</span>
          </h1>
          <p>
            Freebets brings sportsbook odds into one place, so you can compare both sides of a market and work out the
            stakes for a matched bet.
          </p>
          <p>New to matched betting? Start with the guide. Already familiar? Head straight to the bets.</p>
          <div className="page-actions">
            <a className="primary-action" href="#/bets">
              Browse bets <span aria-hidden="true">↗</span>
            </a>
            <a className="secondary-action" href="#/learn">
              Learn how it works
            </a>
          </div>
          <div className="connected-books">
            <span>Connected books</span>
            <div>
              {book_options.map((book) => (
                <img
                  key={book.value}
                  width="28"
                  height="28"
                  src={`${process.env.PUBLIC_URL}/books/${book.value}.png`}
                  alt={book.label}
                  title={book.label}
                />
              ))}
            </div>
          </div>
        </div>
        <section className="state-panel" aria-labelledby="state-title">
          <h2 id="state-title">Start with your state</h2>
          <p>Choose a state to see which sportsbooks offer online betting there.</p>
          <StateSelector {...props} />
        </section>
      </div>
      <section className="getting-started" aria-labelledby="getting-started-title">
        <div className="section-introduction">
          <h2 id="getting-started-title">Getting started</h2>
          <p>A little context before your first comparison.</p>
        </div>
        <ol className="step-grid">
          <li>
            <span className="step-number">01</span>
            <h3>Get to know the strategy</h3>
            <p>Learn what matched betting means, how a hedge works, and how cash and bonus bets differ.</p>
            <a href="#/learn">
              Read the guide <span aria-hidden="true">→</span>
            </a>
          </li>
          <li>
            <span className="step-number">02</span>
            <h3>Choose your books and bets</h3>
            <p>On Bets, choose a strategy, select the books you use, and narrow the results by sport.</p>
            <a href="#/bets">
              Explore bets <span aria-hidden="true">→</span>
            </a>
          </li>
          <li>
            <span className="step-number">03</span>
            <h3>Work out both sides</h3>
            <p>
              Open a market’s calculator, enter a stake, and compare the outcomes. Check the current prices and offer
              terms at each book before placing bets there.
            </p>
            <a href="#/learn">
              Understand the results <span aria-hidden="true">→</span>
            </a>
          </li>
        </ol>
      </section>
    </div>
  );
}
