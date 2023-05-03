import React from "react";
import "./Book.css";

export default function Book({ book }: {book: string}) {
  const src = process.env.PUBLIC_URL + "/books/" + book + ".png";
  return <img className="book" src={src} alt={book} />;
}
