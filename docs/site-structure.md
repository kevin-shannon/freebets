# Site structure

The root URL opens Home. Hash routes keep direct links compatible with GitHub
Pages: `#/bets`, `#/tools`, and `#/learn`. The logo returns to `#/`. Learn section
links use `#/learn?section=odds` (and the other section IDs). Navigation keeps the
Bets view mounted so pagination and expanded filters survive a visit to Learn.

Home introduces the comparison workflow and saves a state preference on the
current device. Bets exposes that selector in the filter header, followed by
the available operators' icons. It limits book choices and comparison results,
but does not change the collector's region. State availability, account
eligibility, and the region of an odds feed are separate concerns.

## State availability

`src/data/states.ts` supplies the full state list; `src/data/onlineBettingStates.ts`
limits selectable states to active statewide online betting. `src/data/sportsbooks.ts`
defines the ten-operator catalog, and `src/data/bookAvailability.ts` stores
online coverage and primary source URLs. All 50 states and DC have dated records.
The [availability report](sportsbook-availability.md) contains the full matrix,
operator sources, exclusions, and icon provenance.

Available operators and connected comparison feeds are separate. The header
shows all catalog operators active in the selected state; book filters include
only the connected feeds among them. Individual saved book preferences are
preserved when switching states, while All follows the available connected books.
An unset state shows all ten operators and selects all connected books; clearing
the state restores those defaults. State-specific odds
routing and new operator collectors remain future work.

## Planned tools

Tools contains descriptions only; no tracker or standalone calculator is
implemented. The tracker should account for deposits, withdrawals, and balances
per book, plus individual bet stakes, odds, settlement, and net results. Its
storage and account model remain undecided.

Standalone calculators should reuse the existing strategy calculations with
user-entered odds. The working market-linked calculator remains available on
Bets. Learn contains the onboarding workflow, strategy descriptions, and odds
examples, with links to operator documentation.
