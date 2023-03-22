import './App.css';
import React, { useState } from 'react';
import Select from 'react-select';
import BetsBlock from './BetsBlock';
import BooksBlock from './BooksBlock';
import { components } from "react-select";

function App() {
  return <FilterableBetTable bets={BETS} />;
}

function BetRow({ bet, selectedOption }) {
  return (
    <tr>
      <td>{selectedOption.value === 'arbitrage' ? bet.ev : bet.conversion}</td>
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <td><BetsBlock bet={bet} /></td>
      <td><BooksBlock bet={bet} /></td>
    </tr>
  );
}

function BetTable({ bets, selectedOption }) {
  const rows = [];
  const rate = selectedOption.value === 'arbitrage' ? 'EV' : 'Conversion';
  if (selectedOption.value === 'arbitrage') {
    bets.sort((a, b) => b.ev - a.ev);
  } else {
    bets.sort((a, b) => b.conversion - a.conversion);
  }
  bets.forEach((bet) => {
    rows.push(
      <BetRow
        bet={bet}
        selectedOption={selectedOption}
        key={bet.event + bet.market} />
    );
  });

  return (
    <table>
      <thead>
        <tr>
          <th>{rate}</th>
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
  const [selectedOption, setSelectedOption] = useState(bet_type_options[1]);

  return (
    <div>
      <FilterBar selectedOption={selectedOption} onSelectedOptionChange={setSelectedOption} />
      <BetTable bets={bets} selectedOption={selectedOption} />
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
    newChildren.push(getValue()[0]['label']);
  } else if (props.options.length === nbValues) {
    newChildren.push('All Books');
  } else {
    newChildren.push(`${nbValues} books selected`);
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

function BookSelect({ allowSelectAll, selectAllDefault }) {
  const selectAllOption = { label: 'All', value: 'selectAll' };
  const updatedOptions = [selectAllOption, ...options];
  const [selectedOptions, setSelectedOptions] = useState(selectAllDefault ? allowSelectAll ? updatedOptions : options : []);

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      allowSelectAll ? setSelectedOptions(updatedOptions) : setSelectedOptions(options);
    } else {
      setSelectedOptions([]);
    }
  };

  const handleChange = (selected, action) => {
    if (action.action === 'select-option' && action.option.value === 'selectAll') {
      handleSelectAll(true);
    } else if (action.action === 'deselect-option' && action.option.value === 'selectAll') {
      handleSelectAll(false);
    } else if (action.action === 'select-option' && selected.length === options.length) {
      handleSelectAll(true);
    } else {
      if (action.action === 'deselect-option' && selected.length === options.length)
        selected = selected.filter(obj => obj.value !== 'selectAll');
      setSelectedOptions(selected);
    }
  };

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
      isClearable={false}
      options={allowSelectAll ? updatedOptions : options}
      value={selectedOptions}
      onChange={handleChange} />
  );
}

function BookFilters({ betType }) {
  if (betType.value === 'arbitrage') {
    return (
      <div style={{display: 'flex'}}>
        <BookSelect key="arb" allowSelectAll={true} selectAllDefault={true} />
      </div>
    );
  } else {
    return (
      <div style={{display: 'flex'}}>
        <BookSelect key="free" allowSelectAll={true} selectAllDefault={false} />
        <BookSelect allowSelectAll={true} selectAllDefault={true} />
      </div>
    );
  }
}

function FilterBar({ selectedOption, onSelectedOptionChange }) {
  return (
    <div style={{display: 'flex'}}>
      <Select
        defaultValue={selectedOption}
        options={bet_type_options}
        isSearchable={false}
        onChange={onSelectedOptionChange} />
      <BookFilters betType={selectedOption}/>
    </div>
  );
}

const bet_type_options = [
  { value: 'arbitrage', label: 'Arbitrage' },
  { value: 'free bet', label: 'Free Bet' },
  { value: 'risk-free bet', label: 'Risk-Free Bet'}
];

const options = [
  { value: 'betmgm', label: 'BetMgm' },
  { value: 'caesars', label: 'Caesars' },
  { value: 'draftkings', label: 'Draftkings' },
  { value: 'fanduel', label: 'Fanduel' },
  { value: 'pointsbet', label: 'Pointsbet' },
  { value: 'superbook', label: 'Superbook' },
  { value: 'unibet', label: 'Unibet' },
];

const BETS = [
  {sport: 'nhl', event: 'ANA Ducks vs VAN Canucks', market: 'Total: 10.0', outcomes: Array(2), ev: 95.36, conversion: 78.10, outcomes: [{name: 'Over', odds: 850, books: ['unibet']}, {name: 'Under', odds: -1667, books: ['unibet']}]},
  {sport: 'nhl', event: 'BOS Bruins vs BUF Sabres', market: 'Moneyline', outcomes: Array(2), ev: 97.09, conversion: 56.74, outcomes: [{name: 'BUF Sabres', odds: 160, books: ['draftkings']}, {name: 'BOS Bruins', odds: -182, books: ['fanduel']}]},
  {sport: 'nhl', event: 'CBJ Blue Jackets vs VGK Golden Knights', market: 'Total: 5.5', outcomes: Array(2), ev: 95.43, conversion: 52, outcomes: [{name: 'Under', odds: 143, books: ['unibet']}, {name: 'Over', odds: -175, books: ['betmgm', 'unibet']}]},
  {sport: 'nhl', event: 'STL Blues vs WPG Jets', market: 'Spread: WPG Jets: -1.0', outcomes: Array(2), ev: 95.4, conversion: 50.94, outcomes: [{name: 'WPG Jets -1.0', odds: 135, books: ['unibet']}, {name: 'STL Blues +1.0', odds: -165, books: ['unibet']}]}
];

export default App;