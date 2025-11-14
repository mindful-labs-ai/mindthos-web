import React from 'react';

import { cn } from '@/lib/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  disabled?: boolean;
  className?: string;
}

const ChevronLeftIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const ChevronsLeftIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
    />
  </svg>
);

const ChevronsRightIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 5l7 7-7 7M5 5l7 7-7 7"
    />
  </svg>
);

const range = (start: number, end: number): number[] => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

/**
 * Pagination - 페이지 네비게이션
 * 이전/다음, 번호 버튼, ellipsis 지원
 *
 * @example
 * <Pagination currentPage={5} totalPages={10} onPageChange={setPage} />
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  disabled = false,
  className,
}) => {
  const generatePagination = (): (number | string)[] => {
    const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    const totalBlocks = totalNumbers + 2; // + 2 ellipsis

    if (totalPages <= totalBlocks) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftRange = range(1, 3 + 2 * siblingCount);
      return [...leftRange, '...', totalPages];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      const rightRange = range(totalPages - (2 + 2 * siblingCount), totalPages);
      return [1, '...', ...rightRange];
    }

    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [1, '...', ...middleRange, '...', totalPages];
  };

  const pages = generatePagination();
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePageChange = (page: number) => {
    if (disabled || page < 1 || page > totalPages || page === currentPage)
      return;
    onPageChange(page);
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('inline-flex items-center gap-1', className)}
    >
      {showFirstLast && (
        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={disabled || !canGoPrevious}
          aria-label="Go to first page"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
            'border-2 border-border bg-surface text-fg',
            'transition-colors duration-200',
            'hover:bg-surface-contrast',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface'
          )}
        >
          <ChevronsLeftIcon />
        </button>
      )}

      <button
        type="button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={disabled || !canGoPrevious}
        aria-label="Go to previous page"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
          'border-2 border-border bg-surface text-fg',
          'transition-colors duration-200',
          'hover:bg-surface-contrast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface'
        )}
      >
        <ChevronLeftIcon />
      </button>

      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex h-9 w-9 items-center justify-center text-fg-muted"
            >
              ...
            </span>
          );
        }

        const pageNumber = page as number;
        const isCurrent = pageNumber === currentPage;

        return (
          <button
            key={pageNumber}
            type="button"
            onClick={() => handlePageChange(pageNumber)}
            disabled={disabled}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={cn(
              'flex h-9 min-w-[2.25rem] items-center justify-center rounded-[var(--radius-md)] px-2',
              'border-2 text-sm font-medium',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isCurrent
                ? 'border-primary bg-primary text-surface'
                : 'border-border bg-surface text-fg hover:bg-surface-contrast disabled:hover:bg-surface'
            )}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={disabled || !canGoNext}
        aria-label="Go to next page"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
          'border-2 border-border bg-surface text-fg',
          'transition-colors duration-200',
          'hover:bg-surface-contrast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface'
        )}
      >
        <ChevronRightIcon />
      </button>

      {showFirstLast && (
        <button
          type="button"
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || !canGoNext}
          aria-label="Go to last page"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)]',
            'border-2 border-border bg-surface text-fg',
            'transition-colors duration-200',
            'hover:bg-surface-contrast',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface'
          )}
        >
          <ChevronsRightIcon />
        </button>
      )}
    </nav>
  );
};

Pagination.displayName = 'Pagination';
