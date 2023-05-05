import React from "react";
import "./FilterBar.css";
import Select from "react-select";
import { ActionMeta } from "react-select";
import FormControlLabel from "@mui/material/FormControlLabel";
import { alpha, styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import BookSelect from "./BookSelect";
import { bet_type_options } from "../../Options";
import { BetType, BetOption, BookOption } from "../../enums";
import { ReactComponent as Info } from "../../icons/info.svg";
import { Tooltip } from "react-tooltip";

const BlueSwitch = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: "#2684ff",
    "&:hover": {
      backgroundColor: alpha("#2684ff", theme.palette.action.hoverOpacity),
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "#2684ff",
  },
}));

interface BetTypeStyle {
  control: (base: any) => any;
  menuList: (base: any) => any;
  formControl: any;
  select: any;
  selectedOption: any;
}

const betTypeStyle: BetTypeStyle = {
  control: (base) => ({
    ...base,
    backgroundColor: "#fafafa",
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "#fafafa",
  }),
  formControl: {
    borderRadius: "10px",
    minWidth: 120,
    "& .MuiSelect-select:focus": {
      backgroundColor: "transparent",
    },
  },
  select: {
    "&:focus": {
      backgroundColor: "transparent",
    },
  },
  selectedOption: {
    backgroundColor: "#F5F5F5",
    borderRadius: "10px",
  },
};

interface FilterBarProps {
  betOption: BetOption;
  setBetOption: React.Dispatch<React.SetStateAction<BetOption>>;
  bookA: BookOption[];
  setBookA: React.Dispatch<React.SetStateAction<BookOption[]>>;
  bookB: BookOption[];
  setBookB: React.Dispatch<React.SetStateAction<BookOption[]>>;
  setShowLive: React.Dispatch<React.SetStateAction<boolean>>;
  setShowPush: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FilterBar({ betOption, setBetOption, bookA, setBookA, bookB, setBookB, setShowLive, setShowPush }: FilterBarProps) {
  const onChange = (option: BetOption | null, _actionMeta: ActionMeta<BetOption>) => {
    if (option !== null) {
      setBetOption(option);
    }
  };

  return (
    <table id="filter-bar">
      <tbody>
        <tr>
          <td>
            <div className="filter-cell">
              <label className="select-helper" htmlFor="bet-type">
                Bet Type
              </label>
              <Select
                id="bet-type"
                className="dropdown"
                value={betOption}
                styles={betTypeStyle}
                options={bet_type_options}
                isSearchable={false}
                onChange={onChange}
              />
            </div>
          </td>
          <td>
            {betOption.value === BetType.ARBITRAGE ? (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="books-select">
                  Books
                </label>
                <BookSelect id="books-select" allowSelectAll={true} book={bookA} onBookChange={[setBookA, setBookB]} />
              </div>
            ) : (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="free-bet-select">
                  Free Bet Book
                </label>
                <BookSelect id="free-bet-select" allowSelectAll={true} book={bookA} onBookChange={[setBookA]} />
              </div>
            )}
          </td>
        </tr>
        <tr>
          <td>
            <div className="filter-cell" id="switch-panel">
              <div className="switch-container">
                <FormControlLabel
                  id="show-live"
                  className="switch-element"
                  control={
                    <BlueSwitch
                      onChange={(event) => {
                        setShowLive(event.target.checked);
                      }}
                    />
                  }
                  label="Live Bets"
                />
                <span
                  className="info-span"
                  data-tooltip-id="live-tooltip"
                  data-tooltip-html="Live bets have fast moving<br /> odds and are inheritly more <br />risky. Recommend: Off"
                >
                  <Info className="info-circle" />
                </span>
                <Tooltip id="live-tooltip" style={{ backgroundColor: "rgb(65 62 73)", color: "#fff", opacity: 1, borderRadius: "8px" }} place="top" />
              </div>
              <div className="switch-container">
                <FormControlLabel
                  id="show-push"
                  className="switch-element-"
                  control={
                    <BlueSwitch
                      onChange={(event) => {
                        setShowPush(event.target.checked);
                      }}
                    />
                  }
                  label="Push Bets"
                />
                <span
                  className="info-span"
                  data-tooltip-id="push-tooltip"
                  data-tooltip-html="Push bets are bets have a <br /> chance of neither bet hitting,<br /> Risk-Free/Free bets will not <br />be refunded. Recommend: Off"
                >
                  <Info className="info-circle" />
                </span>
                <Tooltip id="push-tooltip" style={{ backgroundColor: "rgb(65 62 73)", color: "#fff", opacity: 1, borderRadius: "8px" }} place="bottom" />
              </div>
            </div>
          </td>
          <td>
            {betOption.value === BetType.ARBITRAGE ? null : (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="hedge-book-select">
                  Hedge Book
                </label>
                <BookSelect id="hedge-book-select" allowSelectAll={true} book={bookB} onBookChange={[setBookB]} />
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
