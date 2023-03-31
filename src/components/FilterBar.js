import Select from "react-select";
import BookFilters from "./BookFilters";
import { bet_type_options } from "./Options";

export default function FilterBar({ betType, onBetTypeChange, bookA, onBookAChange, bookB, onBookBChange }) {
  return (
    <div style={{ display: "flex" }}>
      <div>
        <label htmlFor="Bet Type">Bet Type</label>
        <Select id="Bet Type" className="dropdown" value={betType} options={bet_type_options} isSearchable={false} onChange={onBetTypeChange} />
      </div>
      <BookFilters betType={betType} bookA={bookA} onBookAChange={onBookAChange} bookB={bookB} onBookBChange={onBookBChange} />
    </div>
  );
}
