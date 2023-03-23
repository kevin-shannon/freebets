import './App.css';
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import BetsBlock from './BetsBlock';
import BooksBlock from './BooksBlock';
import { components } from "react-select";

function App() {
  return <FilterableBetTable bets={BETS} />;
}

function BetRow({ bet, betType }) {
  return (
    <tr>
      <td>{betType.value === 'arbitrage' ? bet.ev : bet.conversion}</td>
      <td>{bet.event}</td>
      <td>{bet.market}</td>
      <td><BetsBlock bet={bet} /></td>
      <td><BooksBlock bet={bet} /></td>
    </tr>
  );
}

function BetTable({ bets, betType }) {
  const rows = [];
  const rate = betType.value === 'arbitrage' ? 'EV' : 'Conversion';
  if (betType.value === 'arbitrage') {
    bets.sort((a, b) => b.ev - a.ev);
  } else {
    bets.sort((a, b) => b.conversion - a.conversion);
  }
  bets.forEach((bet) => {
    rows.push(
      <BetRow
        bet={bet}
        betType={betType}
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
  const [betType, setBetType] = useState(bet_type_options[0]);
  const [bookA, setBookA] = useState([]);
  const [bookB, setBookB] = useState([]);

  if (!bookA.length || !bookB.length) {
    return (
      <div>
        <FilterBar betType={betType} onBetTypeChange={setBetType} bookA={bookA} onBookAChange={setBookA} bookB={bookB} onBookBChange={setBookB} />
      </div>
    );
  } else {
    return (
      <div>
        <FilterBar betType={betType} onBetTypeChange={setBetType} bookA={bookA} onBookAChange={setBookA} bookB={bookB} onBookBChange={setBookB} />
        <BetTable bets={bets} betType={betType} bookA={bookA} bookB={bookB} />
      </div>
    );
  }
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

function BookSelect({ allowSelectAll, selectAllDefault, book, onBookChange }) {
  const selectAllOption = { label: 'All', value: 'selectAll' };
  const updatedOptions = [selectAllOption, ...book_options];
  function onBooksChange(input) {
    onBookChange.forEach(func => {
      func(input);
    });
  }
  useEffect(() => {
    onBooksChange(selectAllDefault ? allowSelectAll ? updatedOptions : book_options : []);
  }, []); 

  const handleSelectAll = (selectAll) => {
    selectAll ? allowSelectAll ? onBooksChange(updatedOptions) : onBooksChange(book_options) : onBooksChange([]);
  };

  const handleChange = (selected, action) => {
    console.log('change')
    if (action.action === 'select-option' && action.option.value === 'selectAll') {
      handleSelectAll(true);
    } else if (action.action === 'deselect-option' && action.option.value === 'selectAll') {
      handleSelectAll(false);
    } else if (action.action === 'select-option' && selected.length === book_options.length) {
      handleSelectAll(true);
    } else {
      if (action.action === 'deselect-option' && selected.length === book_options.length)
        selected = selected.filter(obj => obj.value !== 'selectAll');
        onBooksChange(selected);
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
      options={allowSelectAll ? updatedOptions : book_options}
      value={book}
      onChange={handleChange} />
  );
}

function BookFilters({ betType, bookA, onBookAChange, bookB, onBookBChange }) {
  if (betType.value === 'arbitrage') {
    return (
      <div style={{display: 'flex'}}>
        <BookSelect key='arb' allowSelectAll={true} selectAllDefault={true} book={bookA} onBookChange={[onBookAChange, onBookBChange]} />
      </div>
    );
  } else {
    return (
      <div style={{display: 'flex'}}>
        <BookSelect key='free' allowSelectAll={true} selectAllDefault={false} book={bookA} onBookChange={[onBookAChange]} />
        <BookSelect allowSelectAll={true} selectAllDefault={true} book={bookB} onBookChange={[onBookBChange]} />
      </div>
    );
  }
}

function FilterBar({ betType, onBetTypeChange, bookA, onBookAChange, bookB, onBookBChange }) {
  return (
    <div style={{display: 'flex'}}>
      <Select
        defaultValue={betType}
        options={bet_type_options}
        isSearchable={false}
        onChange={onBetTypeChange} />
      <BookFilters betType={betType} bookA={bookA} onBookAChange={onBookAChange} bookB={bookB} onBookBChange={onBookBChange} />
    </div>
  );
}

const bet_type_options = [
  { value: 'arbitrage', label: 'Arbitrage' },
  { value: 'free bet', label: 'Free Bet' },
  { value: 'risk-free bet', label: 'Risk-Free Bet'}
];

const book_options = [
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