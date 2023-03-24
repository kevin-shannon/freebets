export default function Book({ book }) {
  const src = "books/" + book + ".png";
  return <img className="book" src={src} alt={book} />;
}
