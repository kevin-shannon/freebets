import Book from './Book.js'

export default function BooksBlock({ bet }) {
    const books_a = [];
    const books_b = [];
    bet.outcomes[0].books.forEach((book) => {
      books_a.push(
        <Book
          book={book}
          key={book} />
      )
    })
    bet.outcomes[1].books.forEach((book) => {
      books_b.push(
        <Book
          book={book}
          key={book} />
      )
    })
  
    return (
      <table>
        <tbody>
          <tr>
            <td>{bet.outcomes[0].odds}</td>
            <td>{books_a}</td>
          </tr>
          <tr>
            <td>{bet.outcomes[1].odds}</td>
            <td>{books_b}</td>
          </tr>
        </tbody>
      </table>
    )
  }