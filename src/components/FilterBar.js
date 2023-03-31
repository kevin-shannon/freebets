import "./FilterBar.css";
import Select from "react-select";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import BookSelect from "./BookSelect";
import { bet_type_options } from "./Options";

const dropdownStyle = {
  control: (base) => ({
    ...base,
    backgroundColor: "#fafafa",
  }),
};

export default function FilterBar({ betType, onBetTypeChange, bookA, onBookAChange, bookB, onBookBChange }) {
  return (
    <table id="filter-bar">
      <tbody>
        <tr>
          <td>
            <label htmlFor="bet-type">Bet Type</label>
            <Select
              id="bet-type"
              className="dropdown"
              styles={dropdownStyle}
              value={betType}
              options={bet_type_options}
              isSearchable={false}
              onChange={onBetTypeChange}
            />
          </td>
          <td>
            {betType.value === "arbitrage" ? (
              <BookSelect key="arb" allowSelectAll={true} book={bookA} onBookChange={[onBookAChange, onBookBChange]} helperText="Books" />
            ) : (
              <BookSelect key="free" allowSelectAll={true} book={bookA} onBookChange={[onBookAChange]} helperText="Free Bet Book" />
            )}
          </td>
        </tr>
        <tr>
          <td>
            <div id="switch-panel">
              <FormControlLabel control={<Switch />} label="Show Live Bets" />
              <FormControlLabel control={<Switch />} label="Show Push Bets" />
            </div>
          </td>
          <td>
            {betType.value === "arbitrage" ? "" : <BookSelect allowSelectAll={true} book={bookB} onBookChange={[onBookBChange]} helperText="Hedge Book" />}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
