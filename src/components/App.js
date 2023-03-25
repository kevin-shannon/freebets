import "./App.css";
import React, { useState } from "react";
import FilterBar from "./FilterBar";
import PaginatedBets from "./BetTable";
import filterBets from "../Utils.js";
import data from "../scrape/output/output.json";
import { book_options_all, bet_type_options } from "./Options";

function readyBookList(book) {
  let arr = book.map((ob) => ob.value);
  const indexToRemove = arr.indexOf("all");
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
  return arr;
}

function App() {
  const [betType, setBetType] = useState(bet_type_options[0]);
  const [bookA, setBookA] = useState(book_options_all);
  const [bookB, setBookB] = useState(book_options_all);
  const bets = filterBets(data, betType, readyBookList(bookA), readyBookList(bookB));

  return (
    <div>
      <FilterBar betType={betType} onBetTypeChange={setBetType} bookA={bookA} onBookAChange={setBookA} bookB={bookB} onBookBChange={setBookB} />
      {!bookA.length || !bookB.length ? <h2>Select Some Books!</h2> : <PaginatedBets betsPerPage={10} maxPagesToShow={7} bets={bets} betType={betType} />}
    </div>
  );
}

export default App;
