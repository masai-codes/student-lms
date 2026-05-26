"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

type PageItem =
  | { kind: "page"; page: number }
  | { kind: "ellipsis"; key: string };

/** Build a compact list of page tokens around `currentPage`.
 *  Always shows boundaries and a configurable window of siblings. */
function buildPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PageItem[] {
  if (totalPages <= 0) return [];

  const minVisible = boundaryCount * 2 + siblingCount * 2 + 3;
  if (totalPages <= minVisible) {
    return Array.from({ length: totalPages }, (_, i) => ({
      kind: "page" as const,
      page: i + 1,
    }));
  }

  const startPages = Array.from({ length: boundaryCount }, (_, i) => i + 1);
  const endPages = Array.from(
    { length: boundaryCount },
    (_, i) => totalPages - boundaryCount + i + 1,
  );

  const siblingsStart = Math.max(
    Math.min(currentPage - siblingCount, totalPages - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(currentPage + siblingCount, boundaryCount + siblingCount * 2 + 2),
    endPages[0] - 2,
  );

  const items: PageItem[] = [];

  for (const p of startPages) items.push({ kind: "page", page: p });

  if (siblingsStart > boundaryCount + 2) {
    items.push({ kind: "ellipsis", key: "start-ellipsis" });
  } else if (boundaryCount + 1 < totalPages - boundaryCount) {
    items.push({ kind: "page", page: boundaryCount + 1 });
  }

  for (let p = siblingsStart; p <= siblingsEnd; p += 1) {
    items.push({ kind: "page", page: p });
  }

  if (siblingsEnd < totalPages - boundaryCount - 1) {
    items.push({ kind: "ellipsis", key: "end-ellipsis" });
  } else if (totalPages - boundaryCount > boundaryCount) {
    items.push({ kind: "page", page: totalPages - boundaryCount });
  }

  for (const p of endPages) items.push({ kind: "page", page: p });

  return items;
}

const cellVariants = cva(
  "inline-flex shrink-0 items-center justify-center bg-white outline-none transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-0",
  {
    variants: {
      size: {
        regular: "h-10 min-w-10 px-2 type-b2-md",
        large: "h-12 min-w-12 px-3 type-b1-md",
      },
      interactive: {
        true: "cursor-pointer hover:bg-gray-50 active:bg-gray-100",
        false: "cursor-default",
      },
      state: {
        default: "!text-gray-700",
        active: "bg-blue-50 !text-gray-800",
        disabled: "!text-gray-300 cursor-not-allowed",
      },
    },
    defaultVariants: {
      size: "regular",
      interactive: false,
      state: "default",
    },
  },
);

export type MasaiPaginationSize = "regular" | "large";

export type MasaiPaginationProps = Omit<
  React.HTMLAttributes<HTMLElement>,
  "onChange"
> &
  VariantProps<typeof cellVariants> & {
    /** 1-based current page. */
    currentPage: number;
    /** Total number of pages (>= 1). */
    totalPages: number;
    /** Fired when the user clicks a page or the prev/next chevron. */
    onPageChange: (page: number) => void;
    /** Sibling pages on each side of the current page. Default: 1. */
    siblingCount?: number;
    /** Boundary pages pinned at the start and end. Default: 1. */
    boundaryCount?: number;
    /** Hide the leading "previous" chevron. */
    hidePrev?: boolean;
    /** Hide the trailing "next" chevron. */
    hideNext?: boolean;
    /** Visual size token. Default: regular. */
    size?: MasaiPaginationSize;
    /** Accessible label for the wrapping <nav>. */
    ariaLabel?: string;
  };

export function MasaiPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  hidePrev = false,
  hideNext = false,
  size = "regular",
  className,
  ariaLabel = "Pagination",
  ...props
}: MasaiPaginationProps) {
  const hasPages = totalPages >= 1;
  const safePage = hasPages ? Math.min(Math.max(currentPage, 1), totalPages) : 1;
  const isFirst = safePage <= 1;
  const isLast = safePage >= totalPages;

  const items = React.useMemo(
    () =>
      hasPages
        ? buildPageItems(safePage, totalPages, siblingCount, boundaryCount)
        : [],
    [hasPages, safePage, totalPages, siblingCount, boundaryCount],
  );

  if (!hasPages) return null;

  const goTo = (page: number) => {
    const next = Math.min(Math.max(page, 1), totalPages);
    if (next !== safePage) onPageChange(next);
  };

  const iconSize = size === "large" ? 20 : 16;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_1px_2px_rgba(17,25,40,0.04)] divide-x divide-gray-200",
        className,
      )}
      {...props}
    >
      {!hidePrev ? (
        <button
          type="button"
          aria-label="Go to previous page"
          disabled={isFirst}
          onClick={() => goTo(safePage - 1)}
          className={cn(
            cellVariants({
              size,
              interactive: !isFirst,
              state: isFirst ? "disabled" : "default",
            }),
            !isFirst && "!text-primary-600",
          )}
        >
          <ChevronLeft size={iconSize} aria-hidden />
        </button>
      ) : null}

      {items.map((item) => {
        if (item.kind === "ellipsis") {
          return (
            <span
              key={item.key}
              aria-hidden="true"
              className={cn(
                cellVariants({ size, interactive: false, state: "default" }),
              )}
            >
              …
            </span>
          );
        }

        const isActive = item.page === safePage;

        return (
          <button
            key={`page-${item.page}`}
            type="button"
            aria-label={`Go to page ${item.page}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => goTo(item.page)}
            className={cn(
              cellVariants({
                size,
                interactive: !isActive,
                state: isActive ? "active" : "default",
              }),
            )}
          >
            {item.page}
          </button>
        );
      })}

      {!hideNext ? (
        <button
          type="button"
          aria-label="Go to next page"
          disabled={isLast}
          onClick={() => goTo(safePage + 1)}
          className={cn(
            cellVariants({
              size,
              interactive: !isLast,
              state: isLast ? "disabled" : "default",
            }),
            !isLast && "!text-primary-600",
          )}
        >
          <ChevronRight size={iconSize} aria-hidden />
        </button>
      ) : null}
    </nav>
  );
}
