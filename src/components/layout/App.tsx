import "./App.css";
import React, { useState, useEffect } from "react";
import FilterBar from "../filter/FilterBar";
import BetTable from "../list/BetTable";
import Footer from "./Footer";
import { filterBets } from "../../Utils";
import { book_options_all, bet_type_options } from "../../Options";
import axios from "axios";
import "typeface-roboto";
import "typeface-roboto-mono";
import { Option } from "../../enums"

function readyBookList(book: Option[]) {
  let arr = book.map((ob) => ob.value);
  const indexToRemove = arr.indexOf("all");
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
  return arr;
}

function App() {
  const [betOption, setBetOption] = useState(bet_type_options[1]);
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

  const bets = filterBets(data, betOption, readyBookList(bookA), readyBookList(bookB), showLive, showPush);

  return (
    <div className="site">
      <div className="content">
        <FilterBar
          betOption={betOption}
          setBetOption={setBetOption}
          bookA={bookA}
          setBookA={setBookA}
          bookB={bookB}
          setBookB={setBookB}
          setShowLive={setShowLive}
          setShowPush={setShowPush}
        />
        {!bookA.length || !bookB.length ? (
          <div className="select-books-message-container">
            <span className="select-some-books">Select some books</span>
          </div>
        ) : (
          <BetTable betsPerPage={10} bets={bets} betOption={betOption} />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;
