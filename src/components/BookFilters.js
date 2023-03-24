import BookSelect from "./BookSelect";

export default function BookFilters({ betType, bookA, onBookAChange, bookB, onBookBChange }) {
  return betType.value === "arbitrage" ? (
    <div style={{ display: "flex" }}>
      <BookSelect key="arb" allowSelectAll={true} selectAllDefault={true} book={bookA} onBookChange={[onBookAChange, onBookBChange]} />
    </div>
  ) : (
    <div style={{ display: "flex" }}>
      <BookSelect key="free" allowSelectAll={true} selectAllDefault={true} book={bookA} onBookChange={[onBookAChange]} />
      <BookSelect allowSelectAll={true} selectAllDefault={true} book={bookB} onBookChange={[onBookBChange]} />
    </div>
  );
}