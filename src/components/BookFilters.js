import BookSelect from "./BookSelect";

export default function BookFilters({ betType, bookA, onBookAChange, bookB, onBookBChange }) {
    if (betType.value === 'arbitrage') {
      return (
        <div style={{display: 'flex'}}>
          <BookSelect key='arb' allowSelectAll={true} selectAllDefault={true} book={bookA} onBookChange={[onBookAChange, onBookBChange]} />
        </div>
      );
    } else {
      return (
        <div style={{display: 'flex'}}>
          <BookSelect key='free' allowSelectAll={true} selectAllDefault={true} book={bookA} onBookChange={[onBookAChange]} />
          <BookSelect allowSelectAll={true} selectAllDefault={true} book={bookB} onBookChange={[onBookBChange]} />
        </div>
      );
    }
  }