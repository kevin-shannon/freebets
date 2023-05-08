import "./Book.css";
import { Tooltip } from "react-tooltip";

export default function Book({ book }: { book: string }) {
  const src = process.env.PUBLIC_URL + "/books/" + book + ".png";
  return (
    <div>
      <span data-tooltip-id="book-tool" style={{ display: "flex" }} data-tooltip-html={book}>
        <img className="book" src={src} alt={book} />
      </span>
      <Tooltip id="book-tool" style={{ backgroundColor: "rgb(65 62 73)", color: "#fff", opacity: 1, borderRadius: "8px" }} place="bottom" />
    </div>
  );
}
