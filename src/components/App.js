import './App.css';
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import BetsBlock from './BetsBlock';
import BooksBlock from './BooksBlock';
import { components } from "react-select";
import aggregate from "../aggregate/aggregate.js";
import data from "../scrape/output/output.json";

function App() {
  return <FilterableBetTable />;
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

function removeVal(arr, val) {
  const indexToRemove = arr.indexOf(val);
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
}

function FilterableBetTable() {
  const [betType, setBetType] = useState(bet_type_options[0]);
  const [bookA, setBookA] = useState([]);
  const [bookB, setBookB] = useState([]);
  
  let books_a = bookA.map(ob => ob.value);
  let books_b = bookB.map(ob => ob.value);
  removeVal(books_a, 'all');
  removeVal(books_b, 'all');
  const bets = aggregate(data, books_a, books_b);

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
  const selectAllOption = { label: 'All', value: 'all' };
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
    if (action.action === 'select-option' && action.option.value === 'all') {
      handleSelectAll(true);
    } else if (action.action === 'deselect-option' && action.option.value === 'all') {
      handleSelectAll(false);
    } else if (action.action === 'select-option' && selected.length === book_options.length) {
      handleSelectAll(true);
    } else {
      if (action.action === 'deselect-option' && selected.length === book_options.length)
        selected = selected.filter(obj => obj.value !== 'all');
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
        <BookSelect key='free' allowSelectAll={true} selectAllDefault={true} book={bookA} onBookChange={[onBookAChange]} />
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

export default App;