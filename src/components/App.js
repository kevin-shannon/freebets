import './App.css';
import React, { useState } from 'react';
import FilterBar from './FilterBar';
import BetTable from './BetTable';
import aggregate from "../aggregate/aggregate.js";
import data from "../scrape/output/output.json";

function readyBookList(book) {
  let arr = book.map(ob => ob.value)
  const indexToRemove = arr.indexOf('all');
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
  return arr;
}

function App() {
  const [betType, setBetType] = useState('');
  const [bookA, setBookA] = useState([]);
  const [bookB, setBookB] = useState([]);
  const bets = aggregate(data, readyBookList(bookA), readyBookList(bookB));

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

export default App;