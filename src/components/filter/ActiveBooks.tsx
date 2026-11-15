import { getActiveSportsbooks } from "../../data/bookAvailability";
import { StateCode } from "../../data/states";
import Book from "../common/Book";

export default function ActiveBooks({ state }: { state: StateCode | "" }) {
  const books = getActiveSportsbooks(state);
  return (
    <div className="active-books" role="group" aria-label="Active online sportsbooks">
      <span className="active-books-label">Active books:</span>
      {books.length ? (
        <div className="active-book-icons">
          {books.map((book) => (
            <Book
              key={book.id}
              book={book.id}
              title={book.hasOdds ? book.name : `${book.name} · Odds comparisons coming soon`}
            />
          ))}
        </div>
      ) : (
        <span className="active-books-empty">None of these books in this state</span>
      )}
    </div>
  );
}
