import "./App.css";
import React, { useState, useEffect } from "react";
import FilterBar from "../filter/FilterBar";
import BetTable from "../list/BetTable";
import Footer from "./Footer";
import { filterBets } from "../../Utils.js";
import { book_options_all, bet_type_options } from "../../Options";
import axios from "axios";
import "typeface-roboto";
import "typeface-roboto-mono";

function readyBookList(book) {
  let arr = book.map((ob) => ob.value);
  const indexToRemove = arr.indexOf("all");
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
  return arr;
}

function App() {
  const [betType, setBetType] = useState(bet_type_options[1]);
  const [bookA, setBookA] = useState(book_options_all);
  const [bookB, setBookB] = useState(book_options_all);
  const [showLive, setShowLive] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("https://stanleys-bucket.s3.us-east-2.amazonaws.com/output.json")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const bets = filterBets(data, betType, readyBookList(bookA), readyBookList(bookB), showLive, showPush);

  return (
    <div className="site">
      <div className="content">
        <FilterBar
          betType={betType}
          onBetTypeChange={setBetType}
          bookA={bookA}
          onBookAChange={setBookA}
          bookB={bookB}
          onBookBChange={setBookB}
          setShowLive={setShowLive}
          setShowPush={setShowPush}
        />
        {!bookA.length || !bookB.length ? <h2>Select Some Books!</h2> : <BetTable betsPerPage={10} bets={bets} betType={betType} />}
      </div>
      <Footer />
    </div>
  );
}

export default App;
