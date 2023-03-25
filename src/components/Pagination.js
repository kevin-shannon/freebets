import React from "react";

function Pagination({ currentPage, totalPages, maxPagesToShow, onPageChange }) {
  let pageNumbers = [];
  pageNumbers.push(["<", Math.max(currentPage - 1, 1)]);
  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push([i, i]);
    }
  } else if (currentPage <= 3) {
    for (let i = 1; i <= 5; i++) {
      pageNumbers.push([i, i]);
    }
    pageNumbers.push(["...", 6]);
    pageNumbers.push([totalPages, totalPages]);
  } else if (currentPage >= totalPages - 2) {
    pageNumbers.push([1, 1]);
    pageNumbers.push(["...", totalPages - 5]);
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pageNumbers.push([i, i]);
    }
  } else {
    pageNumbers.push([1, 1]);
    pageNumbers.push(["...", currentPage - 2]);
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pageNumbers.push([i, i]);
    }
    pageNumbers.push(["...", currentPage + 2]);
    pageNumbers.push([totalPages, totalPages]);
  }
  pageNumbers.push([">", Math.min(currentPage + 1, totalPages)]);

  return (
    <nav>
      <ul className="pagination">
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber[0].toString() + pageNumber[1].toString()}
            className={`page-link${pageNumber[1] === currentPage ? " active" : ""}`}
            onClick={() => onPageChange(pageNumber[1])}
          >
            {pageNumber[0]}
          </button>
        ))}
      </ul>
    </nav>
  );
}

export default Pagination;
