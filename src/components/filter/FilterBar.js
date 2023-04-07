import "./FilterBar.css";
import Select from "react-select";
import FormControlLabel from "@mui/material/FormControlLabel";
import { alpha, styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import BookSelect from "./BookSelect";
import { bet_type_options } from "../../Options";
import { BetType } from "../../enums"

const betTypeStyle = {
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

export default function FilterBar({ betType, onBetTypeChange, bookA, onBookAChange, bookB, onBookBChange, setShowLive, setShowPush }) {
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
                styles={betTypeStyle}
                value={betType}
                options={bet_type_options}
                isSearchable={false}
                onChange={onBetTypeChange}
              />
            </div>
          </td>
          <td>
            {betType.value === BetType.ARBITRAGE ? (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="books-select">
                  Books
                </label>
                <BookSelect id="books-select" allowSelectAll={true} book={bookA} onBookChange={[onBookAChange, onBookBChange]} />
              </div>
            ) : (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="free-bet-select">
                  Free Bet Book
                </label>
                <BookSelect id="free-bet-select" allowSelectAll={true} book={bookA} onBookChange={[onBookAChange]} />
              </div>
            )}
          </td>
        </tr>
        <tr>
          <td>
            <div className="filter-cell" id="switch-panel">
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
                label="Show Live Bets"
              />
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
                label="Show Push Bets"
              />
            </div>
          </td>
          <td>
            {betType.value === BetType.ARBITRAGE ? null : (
              <div className="filter-cell">
                <label className="select-helper" htmlFor="hedge-book-select">
                  Hedge Book
                </label>
                <BookSelect id="hedge-book-select" allowSelectAll={true} book={bookB} onBookChange={[onBookBChange]} />
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
