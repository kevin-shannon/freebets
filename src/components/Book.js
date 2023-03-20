export default function Book({ book }) {
    const src = 'books/' + book + '.png'
    const size = 20
    return (
      <>
        <img
          className="book"
          src={src}
          alt={book}
        />
      </>
    );
  }
  