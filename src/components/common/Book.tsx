import "./Book.css";
import { getSportsbook } from "../../data/sportsbooks";

export default function Book({ book, title }: { book: string; title?: string }) {
  const details = getSportsbook(book);
  return (
    <img
      className="book"
      src={`${process.env.PUBLIC_URL}/books/${details?.icon || `${book}.png`}`}
      alt={details?.name || book}
      title={title || details?.name || book}
      width="27"
      height="27"
      loading="lazy"
    />
  );
}
