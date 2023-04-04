import "./BooksBlock.css";
import ImageList from "@mui/material/ImageList";
import Book from "../common/Book.js";

export default function BooksBlock({ bet }) {
  const books_a = [];
  const books_b = [];
  bet.outcomes[0].books.forEach((book) => {
    books_a.push(<Book book={book} key={book} />);
  });
  bet.outcomes[1].books.forEach((book) => {
    books_b.push(<Book book={book} key={book} />);
  });

  return (
    <table>
      <tbody>
        <tr>
          <td className="odds-value">{bet.outcomes[0].odds > 0 ? "+" + bet.outcomes[0].odds : bet.outcomes[0].odds}</td>
          <td>
            <div className="books-container">
              <ImageList style={{ margin: 0, gap: 2 }} cols={Math.min(3, books_a.length)}>
                {books_a}
              </ImageList>
            </div>
          </td>
        </tr>
        <tr style={{ borderTop: "1px solid #cccccc" }}>
          <td className="odds-value">{bet.outcomes[1].odds > 0 ? "+" + bet.outcomes[1].odds : bet.outcomes[1].odds}</td>
          <td>
            <div className="books-container">
              <ImageList style={{ margin: 0, gap: 2 }} cols={Math.min(3, books_b.length)}>
                {books_b}
              </ImageList>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
