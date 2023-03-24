import React, { useEffect } from "react";
import Select from "react-select";
import BookFilters from "./BookFilters";

export default function FilterBar({ betType, onBetTypeChange, bookA, onBookAChange, bookB, onBookBChange }) {
  useEffect(() => {
    onBetTypeChange(bet_type_options[0]);
  }, [onBetTypeChange]);

  return (
    <div style={{ display: "flex" }}>
      <Select defaultValue={bet_type_options[0]} options={bet_type_options} isSearchable={false} onChange={onBetTypeChange} />
      <BookFilters betType={betType} bookA={bookA} onBookAChange={onBookAChange} bookB={bookB} onBookBChange={onBookBChange} />
    </div>
  );
}

const bet_type_options = [
  { value: "arbitrage", label: "Arbitrage" },
  { value: "free bet", label: "Free Bet" },
  { value: "risk-free bet", label: "Risk-Free Bet" },
];
