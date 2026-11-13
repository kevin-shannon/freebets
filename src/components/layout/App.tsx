import "./App.css";
import { useState, useEffect, createContext, Dispatch, SetStateAction } from "react";
import FilterBar from "../filter/FilterBar";
import BetTable from "../list/BetTable";
import Footer from "./Footer";
import { filterBets } from "../../Utils";
import { book_options_all, bet_type_options, sport_options_all, normalizeBookSelection } from "../../Options";
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

interface ThemeContextType {
  setTheme: Dispatch<SetStateAction<null | string>>;
}

export const ThemeContext = createContext<ThemeContextType>({
  setTheme: () => {},
});

interface FeedStatus {
  generatedAt: string;
  region: string;
  state: string;
  books: Record<string, { state: string }>;
}

const dataUrl = process.env.REACT_APP_DATA_URL ||
  (process.env.NODE_ENV === "development"
    ? `${process.env.PUBLIC_URL}/output.json`
    : "https://stanleys-bucket.s3.us-east-2.amazonaws.com/output.json");
const statusUrl = process.env.REACT_APP_STATUS_URL || dataUrl.replace(/[^/?]+(?:\?.*)?$/, "scrape-status.json");
const freshnessLimit = 15 * 60 * 1000;
const bookNames: Record<string, string> = { betmgm: "BetMGM", caesars: "Caesars", draftkings: "DraftKings", fanduel: "FanDuel" };

function App() {
  const [betOption, setBetOption] = useLocalStorageState("betOption", bet_type_options[0]);
  const [bookA, setBookA] = useLocalStorageState("bookA", book_options_all, normalizeBookSelection);
  const [bookB, setBookB] = useLocalStorageState("bookB", book_options_all, normalizeBookSelection);
  const [sport, setSport] = useLocalStorageState("sport", sport_options_all);
  const [minOdds, setMinOdds] = useLocalStorageState<AmericanOdds>("minOdds", null);
  const [maxOdds, setMaxOdds] = useLocalStorageState<AmericanOdds>("maxOdds", null);
  const [showLive, setShowLive] = useLocalStorageState("showLive", false);
  const [showPush, setShowPush] = useLocalStorageState("showPush", false);
  const [showToday, setShowToday] = useLocalStorageState("showToday", false);
  const [data, setData] = useState<any[]>([]);
  const [feedStatus, setFeedStatus] = useState<FeedStatus | null>(null);
  const [dataError, setDataError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hamburgerActive, setHamburgerActive] = useState(false);
  const [theme, setTheme] = useState<null | string>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [oddsResponse, statusResponse] = await Promise.allSettled([
          axios.get(dataUrl, { timeout: 15000, params: { updated: Date.now() } }),
          axios.get<FeedStatus>(statusUrl, { timeout: 15000, params: { updated: Date.now() } }),
        ]);
        if (!active) return;
        if (oddsResponse.status !== "fulfilled" || !Array.isArray(oddsResponse.value.data)) {
          throw new Error("Current odds are unavailable. Please try again later.");
        }
        const candidate = statusResponse.status === "fulfilled" ? statusResponse.value.data : null;
        const status = candidate && typeof candidate.generatedAt === "string" && typeof candidate.region === "string" && candidate.books
          ? candidate : null;
        const timestamp = status && Date.parse(status.generatedAt);
        if (status && (!timestamp || Date.now() - timestamp > freshnessLimit)) {
          throw new Error("Odds are out of date. Waiting for a fresh update.");
        }
        if (status && status.state === "failed") {
          throw new Error("The sportsbooks could not be refreshed. Waiting for a fresh update.");
        }
        // The previous hosted feed has no status file and contains only 2024 games.
        if (!status && !oddsResponse.value.data.some((bet: { start: string }) => Date.parse(bet.start) > Date.now())) {
          throw new Error("No current odds are available. Waiting for a fresh update.");
        }
        setData(oddsResponse.value.data);
        setFeedStatus(status);
        setDataError("");
      } catch (error) {
        if (active) {
          setData([]);
          setDataError(error instanceof Error ? error.message : "Current odds are unavailable.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (betOption.value === BetType.ARBITRAGE) {
      setBookB(bookA);
    }
  }, [betOption, bookA, setBookB]);

  const bets = filterBets(data, betOption, removeAllFromBook(bookA), removeAllFromBook(bookB), minOdds, maxOdds, showLive, showPush, showToday);
  const unavailableBooks = feedStatus ? Object.entries(feedStatus.books)
    .filter(([book, status]) => bookNames[book] && !["ok", "no_events"].includes(status.state))
    .map(([book]) => bookNames[book]) : [];

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
    <ThemeContext.Provider value={{ setTheme }}>
      <div className={`site ${theme === "light" ? "light-mode" : "dark-mode"}`}>
        <Navbar hamburgerActive={hamburgerActive} setHamburgerActive={setHamburgerActive} />
        <div className="content">
          <div
            className={`content-backdrop ${hamburgerActive ? "active" : ""}`}
            onClick={() => {
              setHamburgerActive(false);
            }}
          ></div>
          <FilterBar {...filterBarProps} />
          <div className="feed-status" role="status" aria-live="polite">
            {loading ? "Loading current odds…" : dataError || (feedStatus
              ? `Updated ${new Date(feedStatus.generatedAt).toLocaleTimeString()} · ${feedStatus.region.toUpperCase()}${unavailableBooks.length
                ? ` · Limited coverage: ${unavailableBooks.join(", ")} unavailable or incomplete`
                : ""}`
              : "Update time unavailable")}
          </div>
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
    </ThemeContext.Provider>
  );
}

export default App;
