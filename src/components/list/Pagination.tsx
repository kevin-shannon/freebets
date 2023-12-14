import React from "react";
import "./Pagination.css";
import { ReactComponent as ChevronLeft } from "../../icons/chevron-left.svg";
import { ReactComponent as ChevronRight } from "../../icons/chevron-right.svg";

interface PaginationProps {
  total: number;
  siblings: number;
  boundaries: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

function Pagination({ total, siblings, boundaries, page, setPage }: PaginationProps) {
  let pageNumbers: [string | number, number][] = [];

  const maxPagesToShow = 2 * siblings + 2 * boundaries + 3;
  if (total <= maxPagesToShow) {
    for (let i = 1; i <= total; i++) {
      pageNumbers.push([i, i]);
    }
  } else {
    if (page <= siblings + boundaries + 2) {
      for (let i = 1; i <= 2 * siblings + boundaries + 2; i++) {
        pageNumbers.push([i, i]);
      }
      pageNumbers.push(["…", 2 * siblings + boundaries + 3]);
      for (let i = total - boundaries + 1; i <= total; i++) {
        pageNumbers.push([i, i]);
      }
    } else if (page >= total - (siblings + boundaries + 1)) {
      for (let i = 1; i <= boundaries; i++) {
        pageNumbers.push([i, i]);
      }
      pageNumbers.push(["…", total - (2 * siblings + boundaries + 2)]);
      for (let i = total - (siblings + boundaries + 2); i <= total; i++) {
        pageNumbers.push([i, i]);
      }
    } else {
      for (let i = 1; i <= boundaries; i++) {
        pageNumbers.push([i, i]);
      }
      pageNumbers.push(["…", page - 2]);
      for (let i = page - siblings; i <= page + siblings; i++) {
        pageNumbers.push([i, i]);
      }
      pageNumbers.push(["…", page + 2]);
      for (let i = total - boundaries + 1; i <= total; i++) {
        pageNumbers.push([i, i]);
      }
    }
  }

  return (
    <nav>
      <ul className="pagination">
        <button className={`page-link${page === 1 ? " disabled" : ""}`} onClick={() => setPage(Math.max(1, page - 1))}>
          <ChevronLeft className="pagination-navigation" />
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber.toString()}
            className={`page-link${pageNumber[0] === page ? " active" : ""}${pageNumber[0] === "…" ? " dots" : ""}`}
            onClick={() => setPage(pageNumber[1])}
          >
            {pageNumber[0]}
          </button>
        ))}

        <button className={`page-link${page === total ? " disabled" : ""}`} onClick={() => setPage(Math.min(page + 1, total))}>
          <ChevronRight className="pagination-navigation" />
        </button>
      </ul>
    </nav>
  );
}

export default Pagination;
