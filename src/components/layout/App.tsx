import "./App.css";
import { useState, useEffect } from "react";
import FilterBar from "../filter/FilterBar";
import BetTable from "../list/BetTable";
import Footer from "./Footer";
import { filterBets } from "../../Utils";
import { book_options_all, bet_type_options, sport_options_all } from "../../Options";
import axios from "axios";
import "typeface-roboto";
import "typeface-roboto-mono";
import { BookType, AmericanOdds, BookOption, BetType } from "../../enums";
import Navbar from "../navbar/Navbar";
import useLocalStorageState from "../common/etc/useLocalStorageState";

function removeAllFromBook(book: BookOption[]) {
  let arr = book.map((ob) => ob.value);
  const indexToRemove = arr.indexOf(BookType.ALL);
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
  return arr;
}

function App() {
  const [betOption, setBetOption] = useLocalStorageState("betOption", bet_type_options[0]);
  const [bookA, setBookA] = useLocalStorageState("bookA", book_options_all);
  const [bookB, setBookB] = useLocalStorageState("bookB", book_options_all);
  const [sport, setSport] = useLocalStorageState("sport", sport_options_all);
  const [minOdds, setMinOdds] = useLocalStorageState<AmericanOdds>("minOdds", null);
  const [maxOdds, setMaxOdds] = useLocalStorageState<AmericanOdds>("maxOdds", null);
  const [showLive, setShowLive] = useLocalStorageState("showLive", false);
  const [showPush, setShowPush] = useLocalStorageState("showPush", false);
  const [showToday, setShowToday] = useLocalStorageState("showToday", false);
  const [data, setData] = useState([]);
  const [hamburgerActive, setHamburgerActive] = useState(false);

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

  useEffect(() => {
    if (betOption.value === BetType.ARBITRAGE) {
      setBookB(bookA);
    }
  }, [betOption, bookA]);

  const bets = filterBets(data, betOption, removeAllFromBook(bookA), removeAllFromBook(bookB), minOdds, maxOdds, showLive, showPush, showToday);

  const filterBarProps = {
    betOption,
    setBetOption,
    bookA,
    setBookA,
    bookB,
    setBookB,
    sport,
    setSport,
    minOdds,
    setMinOdds,
    maxOdds,
    setMaxOdds,
    showLive,
    setShowLive,
    showPush,
    setShowPush,
    showToday,
    setShowToday,
  };

  return (
    <div className="site">
      <Navbar hamburgerActive={hamburgerActive} setHamburgerActive={setHamburgerActive} />
      <div className="content">
        <div
          className={`content-backdrop ${hamburgerActive ? "active" : ""}`}
          onClick={() => {
            setHamburgerActive(false);
          }}
        ></div>
        <FilterBar {...filterBarProps} />
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
