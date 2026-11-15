import React from "react";
import "./Pagination.css";
import { ReactComponent as Left } from "../../icons/chevron-left.svg";
import { ReactComponent as Right } from "../../icons/chevron-right.svg";

export default function Pagination({
  total,
  page,
  setPage,
}: {
  total: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  if (total <= 1) return null;
  const visible = Array.from({ length: total }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === total || Math.abs(n - page) <= 1,
  );
  return (
    <nav className="pagination" aria-label="Market pages">
      <button
        type="button"
        className="page-link"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        <Left aria-hidden="true" />
      </button>
      {visible.map((n, i) => (
        <React.Fragment key={n}>
          {i > 0 && n - visible[i - 1] > 1 && (
            <span className="page-ellipsis" aria-hidden="true">
              …
            </span>
          )}
          <button
            type="button"
            className="page-link"
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            onClick={() => setPage(n)}
          >
            {n}
          </button>
        </React.Fragment>
      ))}
      <button
        type="button"
        className="page-link"
        aria-label="Next page"
        disabled={page === total}
        onClick={() => setPage(page + 1)}
      >
        <Right aria-hidden="true" />
      </button>
    </nav>
  );
}
