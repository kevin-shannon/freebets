import React from "react";
import "./FilterBar.css";
import Select from "react-select";
import { ActionMeta } from "react-select";
import CheckSelect from "./CheckSelect";
import { bet_type_options, book_options_all, sport_options_all } from "../../Options";
import { BetType, AmericanOdds, BetOption, BookOption, SportOption } from "../../enums";
import { singleSelectStyle } from "../common/etc/SelectStyle";
import FilterExtra from "./FilterExtra";

interface FilterBarProps {
  betOption: BetOption;
  setBetOption: React.Dispatch<React.SetStateAction<BetOption>>;
  bookA: BookOption[];
  setBookA: React.Dispatch<React.SetStateAction<BookOption[]>>;
  bookB: BookOption[];
  setBookB: React.Dispatch<React.SetStateAction<BookOption[]>>;
  sport: SportOption[];
  setSport: React.Dispatch<React.SetStateAction<SportOption[]>>;
  maxOdds: AmericanOdds;
  setMaxOdds: React.Dispatch<React.SetStateAction<AmericanOdds>>;
  minOdds: AmericanOdds;
  setMinOdds: React.Dispatch<React.SetStateAction<AmericanOdds>>;
  showLive: boolean;
  setShowLive: React.Dispatch<React.SetStateAction<boolean>>;
  showPush: boolean;
  setShowPush: React.Dispatch<React.SetStateAction<boolean>>;
  showToday: boolean;
  setShowToday: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FilterBar(props: FilterBarProps) {
  const changeBetOption = (option: BetOption | null, _actionMeta: ActionMeta<BetOption>) => {
    if (option !== null) {
      setBetOption(option);
    }
  };

  const { betOption, bookA, bookB, sport, minOdds, maxOdds, showLive, showPush, showToday } = props;
  const { setBetOption, setBookA, setBookB, setSport, setMinOdds, setMaxOdds, setShowLive, setShowPush, setShowToday } = props;

  const filterExtraProps = { minOdds, maxOdds, showLive, showPush, showToday, setMinOdds, setMaxOdds, setShowLive, setShowPush, setShowToday };

  return (
    <div className="filter-container">
      <div className="filter-box">
        <div className="filter-bar">
          <div className="filter-col">
            <div className="filter-cell">
              <label className="select-helper" htmlFor="bet-type">
                Bet Type
              </label>
              <Select
                id="bet-type"
                className="dropdown"
                value={betOption}
                styles={singleSelectStyle}
                options={bet_type_options}
                isSearchable={false}
                onChange={changeBetOption}
              />
            </div>
            <div className="filter-cell">
              <label className="select-helper" htmlFor="sport-select">
                Sports
              </label>
              <CheckSelect id="sport-select" options={sport_options_all} value={sport} setValue={setSport} />
            </div>
          </div>
          <div className="filter-col">
            {betOption.value === BetType.ARBITRAGE ? (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="books-select">
                  Books
                </label>
                <CheckSelect id="books-select" options={book_options_all} value={bookA} setValue={setBookA} />
              </div>
            ) : betOption.value === BetType.PLAYTHROUGH ? (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="playthrough-select">
                  Playthrough Book
                </label>
                <CheckSelect id="playthrough-select" options={book_options_all} value={bookA} setValue={setBookA} />
              </div>
            ) : (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="freebet-select">
                  Free Bet Book
                </label>
                <CheckSelect id="freebet-select" options={book_options_all} value={bookA} setValue={setBookA} />
              </div>
            )}
            {betOption.value === BetType.FREEBET || betOption.value === BetType.RISKFREE || betOption.value === BetType.PLAYTHROUGH ? (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="hedge-book-select">
                  Hedge Book
                </label>
                <CheckSelect id="hedge-book-select" options={book_options_all} value={bookB} setValue={setBookB} />
              </div>
            ) : null}
          </div>
        </div>
        <FilterExtra {...filterExtraProps} />
      </div>
    </div>
  );
}
