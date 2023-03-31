import BookSelect from "./BookSelect";

export default function BookFilters({ betType, bookA, onBookAChange, bookB, onBookBChange }) {
  return betType.value === "arbitrage" ? (
    <div style={{ display: "flex" }}>
      <BookSelect key="arb" allowSelectAll={true} book={bookA} onBookChange={[onBookAChange, onBookBChange]} helperText="Books" />
    </div>
  ) : (
    <div style={{ display: "flex" }}>
      <BookSelect key="free" allowSelectAll={true} book={bookA} onBookChange={[onBookAChange]} helperText="Free Bet Book" />
      <BookSelect allowSelectAll={true} book={bookB} onBookChange={[onBookBChange]} helperText="Hedge Book" />
    </div>
  );
}
