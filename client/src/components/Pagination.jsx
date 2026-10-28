import './Pagination.css';

/**
 * Reusable, enterprise typographic pagination component.
 * Features numeric windowing with ellipsis, previous/next buttons,
 * accessible ARIA labels, and graceful auto-hiding when totalPages <= 1.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  limit,
}) {
  if (totalPages <= 1) return null;

  const current = Math.max(1, Math.min(currentPage, totalPages));

  // Generate page numbers with smart ellipsis windowing
  function getPageNumbers() {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(
          1,
          '...',
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
      }
    }

    return pages;
  }

  const pageNumbers = getPageNumbers();

  // Compute "Showing X–Y of Z items"
  let rangeSummary = null;
  if (totalItems !== undefined && limit !== undefined) {
    const start = (current - 1) * limit + 1;
    const end = Math.min(current * limit, totalItems);
    rangeSummary = `Showing ${start}–${end} of ${totalItems} courses`;
  }

  return (
    <nav className="levelup-pagination-nav" aria-label="Course pagination navigation">
      {rangeSummary && (
        <span className="levelup-pagination-summary">{rangeSummary}</span>
      )}

      <div className="levelup-pagination-controls">
        {/* Previous Button */}
        <button
          type="button"
          className="levelup-pagination-btn levelup-pagination-btn--prev"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Go to previous page"
        >
          <span aria-hidden="true">‹</span> Previous
        </button>

        {/* Numeric Page Buttons */}
        <div className="levelup-pagination-pages">
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="levelup-pagination-ellipsis"
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }

            const isCurrent = page === current;

            return (
              <button
                key={`page-${page}`}
                type="button"
                className={`levelup-pagination-btn levelup-pagination-btn--num ${
                  isCurrent ? 'is-active' : ''
                }`}
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${page}`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          className="levelup-pagination-btn levelup-pagination-btn--next"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          aria-label="Go to next page"
        >
          Next <span aria-hidden="true">›</span>
        </button>
      </div>
    </nav>
  );
}
