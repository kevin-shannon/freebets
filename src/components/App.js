import './App.css';
import React, { useState } from 'react';
import Select from 'react-select';
import _ from "lodash";
import BetsBlock from './BetsBlock';
import BooksBlock from './BooksBlock';
import { components } from "react-select";

function App() {
  return <FilterableBetTable bets={BETS} />;
}

function BetRow({ bet }) {
  return (
    <tr>
      <td>{bet.ev}</td>
      <td>{bet.conversion}</td>
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <td><BetsBlock bet={bet} /></td>
      <td><BooksBlock bet={bet} /></td>
    </tr>
  );
}

function BetTable({ bets }) {
  const rows = [];
  bets.forEach((bet) => {
    rows.push(
      <BetRow
        bet={bet}
        key={bet.event + bet.market} />
    );
  });

  return (
    <table>
      <thead>
        <tr>
          <th>EV</th>
          <th>Conversion</th>
          <th>Event</th>
          <th>Market</th>
          <th>Bets</th>
          <th>Books</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function FilterableBetTable({ bets }) {
  return (
    <div>
      <FilterBar />
      <BetTable bets={bets} />
    </div>
  );
}

const Option = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
        />
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};

const ValueContainer = ({ children, ...props }) => {
  const { getValue, hasValue } = props;
  const newChildren = [];
  const nbValues = getValue().length;
  if (nbValues === 1) {
    newChildren.push(children[0][0].key.replace(/-.*/g, ""));
  } else {
    newChildren.push(`${nbValues} items selected`);
  }
  newChildren.push(children[1]);

  if (!hasValue) {
    return (
      <components.ValueContainer {...props}>
        {children}
      </components.ValueContainer>
    );
  }
  return (
    <components.ValueContainer {...props}>
      {newChildren}
    </components.ValueContainer>
  );
};

function BookSelect() {
  return (
    <Select 
      isMulti={true}
      components={{
        MultiValueContainer: () => null,
        Option,
        ValueContainer: ValueContainer,
      }}
      hideSelectedOptions={false}
      closeMenuOnSelect={false} 
      isSearchable={false}
      options={options} />
  );
}

function BookFilters() {
  return (
    <div style={{display: 'flex'}}>
      <BookSelect />
      
    </div>
  );
}

function FilterBar() {
  const [selectedOption, setSelectedOption] = useState(bet_type_options[1]);
  return (
    <div style={{display: 'flex'}}>
      <Select
        defaultValue={selectedOption}
        options={bet_type_options}
        isSearchable={false}
        onChange={setSelectedOption} />
      <BookFilters />
    </div>
  );
}

const bet_type_options = [
  { value: 'arbitrage', label: 'Arbitrage' },
  { value: 'free bet', label: 'Free Bet' },
  { value: 'risk-free bet', label: 'Risk-Free Bet'}
];

const options = [
  { value: 'betmgm', label: 'BetMgm', key: 1 },
  { value: 'caesars', label: 'Caesars', key: 2 },
  { value: 'draftkings', label: 'Draftkings', key: 3 },
  { value: 'fanduel', label: 'Fanduel', key: 4 },
  { value: 'pointsbet', label: 'Pointsbet', key: 5 },
  { value: 'superbook', label: 'Superbook', key: 6 },
  { value: 'unibet', label: 'Unibet', key: 7 },
];

const BETS = [
  {sport: 'nhl', event: 'ANA Ducks vs VAN Canucks', market: 'Total: 10.0', outcomes: Array(2), ev: 95.36, conversion: 48.10, outcomes: [{name: 'Over', odds: 850, books: ['unibet']}, {name: 'Under', odds: -1667, books: ['unibet']}]},
  {sport: 'nhl', event: 'BOS Bruins vs BUF Sabres', market: 'Moneyline', outcomes: Array(2), ev: 97.09, conversion: 56.74, outcomes: [{name: 'BUF Sabres', odds: 160, books: ['draftkings']}, {name: 'BOS Bruins', odds: -182, books: ['fanduel']}]},
  {sport: 'nhl', event: 'CBJ Blue Jackets vs VGK Golden Knights', market: 'Total: 5.5', outcomes: Array(2), ev: 95.43, conversion: 52, outcomes: [{name: 'Under', odds: 143, books: ['unibet']}, {name: 'Over', odds: -175, books: ['betmgm', 'unibet']}]},
  {sport: 'nhl', event: 'STL Blues vs WPG Jets', market: 'Spread: WPG Jets: -1.0', outcomes: Array(2), ev: 95.4, conversion: 50.94, outcomes: [{name: 'WPG Jets -1.0', odds: 135, books: ['unibet']}, {name: 'STL Blues +1.0', odds: -165, books: ['unibet']}]}
];

export default App;