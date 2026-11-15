import "./App.css";
import { useState, useEffect, useMemo } from "react";
import FilterBar from "../filter/FilterBar";
import BetTable from "../list/BetTable";
import Footer from "./Footer";
import { filterBets } from "../../Utils";
import {
  book_options_all,
  bet_type_options,
  sport_options_all,
  normalizeBookSelection,
  bookOptionsForState,
  restrictBookSelection,
} from "../../Options";
import axios from "axios";
import "typeface-roboto-mono";
import { BookType, AmericanOdds, BookOption, BetType, SportType } from "../../enums";
import Navbar from "../navbar/Navbar";
import useLocalStorageState from "../common/etc/useLocalStorageState";
import usePage from "./usePage";
import HomePage from "../pages/HomePage";
import ToolsPage from "../pages/ToolsPage";
import LearnPage from "../pages/LearnPage";
import { StateCode, states } from "../../data/states";
import { isOnlineBettingState } from "../../data/onlineBettingStates";
import { getActiveSportsbooks } from "../../data/bookAvailability";
import { BrowserCaptureStatus, browserCaptureFresh, removeExpiredBrowserOdds } from "../../data/feedFreshness";

function removeAllFromBook(book: BookOption[]) {
  let arr = book.map((ob) => ob.value);
  const indexToRemove = arr.indexOf(BookType.ALL);
  if (indexToRemove !== -1) {
    arr.splice(indexToRemove, 1);
  }
  return arr;
}

interface FeedStatus {
  generatedAt: string;
  region: string;
  state: string;
  books: Record<string, BrowserCaptureStatus>;
}

const dataUrl =
  process.env.REACT_APP_DATA_URL ||
  (process.env.NODE_ENV === "development"
    ? `${process.env.PUBLIC_URL}/output.json`
    : "https://stanleys-bucket.s3.us-east-2.amazonaws.com/output.json");
const statusUrl = process.env.REACT_APP_STATUS_URL || dataUrl.replace(/[^/?]+(?:\?.*)?$/, "scrape-status.json");
const freshnessLimit = 15 * 60 * 1000;
const bookNames: Record<string, string> = {
  betmgm: "BetMGM",
  caesars: "Caesars",
  draftkings: "DraftKings",
  fanduel: "FanDuel",
  bet365: "bet365",
};

function App() {
  const page = usePage();
  const [selectedState, setSelectedState] = useLocalStorageState<StateCode | "">("selectedState", "", (value) =>
    isOnlineBettingState(value) ? value : "",
  );
  const [betOption, setBetOption] = useLocalStorageState("betOption", bet_type_options[0]);
  const [bookA, setBookA] = useLocalStorageState("bookA", book_options_all, (value) =>
    selectedState ? normalizeBookSelection(value) : book_options_all,
  );
  const [bookB, setBookB] = useLocalStorageState("bookB", book_options_all, (value) =>
    selectedState ? normalizeBookSelection(value) : book_options_all,
  );
  const changeState = (state: StateCode | "") => {
    setSelectedState(state);
    if (!state) {
      setBookA(book_options_all);
      setBookB(book_options_all);
    }
  };
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
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10000);
    return () => window.clearInterval(timer);
  }, []);
  const currentData = useMemo(() => removeExpiredBrowserOdds(data, feedStatus?.books.bet365, now), [data, feedStatus, now]);
  const stateBookOptions = useMemo(() => bookOptionsForState(selectedState), [selectedState]);
  const selectedBookA = useMemo(() => restrictBookSelection(bookA, stateBookOptions), [bookA, stateBookOptions]);
  const selectedBookB = useMemo(() => restrictBookSelection(bookB, stateBookOptions), [bookB, stateBookOptions]);

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
        const status =
          candidate &&
          typeof candidate.generatedAt === "string" &&
          typeof candidate.region === "string" &&
          candidate.books
            ? candidate
            : null;
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
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (betOption.value === BetType.ARBITRAGE) {
      setBookB(bookA);
    }
  }, [betOption, bookA, setBookB]);

  const bets = useMemo(() => {
    const leagues: Record<string, string[]> = {
      basketball: ["nba", "ncaab"],
      baseball: ["mlb"],
      hockey: ["nhl"],
      football: ["nfl", "ncaaf"],
      tennis: ["atp", "wta"],
    };
    const selected = new Set(sport.flatMap((option) => leagues[option.value] || [option.value]));
    const filtered = sport.some((option) => option.value === SportType.ALL)
      ? currentData
      : currentData.filter((bet) => selected.has(bet.sport.toLowerCase()));
    return filterBets(
      filtered,
      betOption,
      removeAllFromBook(selectedBookA),
      removeAllFromBook(selectedBookB),
      minOdds,
      maxOdds,
      showLive,
      showPush,
      showToday,
    );
  }, [currentData, sport, betOption, selectedBookA, selectedBookB, minOdds, maxOdds, showLive, showPush, showToday]);
  const unavailableBooks = feedStatus
    ? Object.entries(feedStatus.books)
        .filter(
          ([book, status]) =>
            stateBookOptions.some((option) => option.value === book) &&
            bookNames[book] &&
            (!["ok", "no_events"].includes(status.state) || (book === "bet365" && !browserCaptureFresh(status, now))),
        )
        .map(([book]) => bookNames[book])
    : [];

  const filterBarProps = {
    state: selectedState,
    onStateChange: changeState,
    bookOptions: stateBookOptions,
    betOption,
    setBetOption,
    bookA: selectedBookA,
    setBookA,
    bookB: selectedBookB,
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
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <Navbar page={page} />
      <main className="content" id="main" tabIndex={-1} aria-busy={page === "bets" && loading}>
        {page === "home" && <HomePage state={selectedState} onStateChange={changeState} />}
        {page === "tools" && <ToolsPage />}
        {page === "learn" && <LearnPage />}
        <div hidden={page !== "bets"}>
          <h1 className="sr-only">Bets</h1>
          <FilterBar {...filterBarProps} />
          <section id="markets" aria-label="Matched markets">
            <div className="results-heading">
              <h2>Matched markets {!loading && <span>{bets.length.toLocaleString()}</span>}</h2>
              <div className="feed-status" role="status" aria-live="polite">
                {loading
                  ? "Loading current odds…"
                  : dataError ||
                    (feedStatus
                      ? `Updated ${new Date(feedStatus.generatedAt).toLocaleTimeString()}${
                          unavailableBooks.length
                            ? ` · Limited coverage: ${unavailableBooks.join(", ")} unavailable or incomplete`
                            : ""
                        }`
                      : "Update time unavailable")}
              </div>
            </div>
            {loading ? (
              <div className="market-loading" aria-hidden="true">
                <div />
                <div />
                <div />
              </div>
            ) : selectedState && !stateBookOptions.length ? (
              <div className="select-books-message-container">
                {getActiveSportsbooks(selectedState).length
                  ? `The online books available in ${states.find(([code]) => code === selectedState)?.[1]} aren't included in odds comparisons yet.`
                  : `None of the listed sportsbooks offers statewide online sports betting in ${states.find(([code]) => code === selectedState)?.[1]}.`}
              </div>
            ) : !selectedBookA.length || !selectedBookB.length ? (
              <div className="select-books-message-container">
                <span className="select-some-books">Select some books</span>
              </div>
            ) : (
              <BetTable key={JSON.stringify(filterBarProps)} betsPerPage={10} bets={bets} betOption={betOption} />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
