export default function Book({ book }) {
  const src = process.env.PUBLIC_URL + "/books/" + book + ".png";
  return <img className="book" src={src} alt={book} />;
}
