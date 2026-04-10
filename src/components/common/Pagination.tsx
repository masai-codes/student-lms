import type { AppPaginationProps } from '@/types'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const MAX_VISIBLE = 5

export default function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AppPaginationProps) {
  if (totalPages <= 1) return null

  const half = Math.floor(MAX_VISIBLE / 2)

  let startPage = Math.max(currentPage - half, 1)
  let endPage = startPage + MAX_VISIBLE - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(endPage - MAX_VISIBLE + 1, 1)
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i,
  )

  return (
    <Pagination>
      <PaginationContent>
        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            onClick={() =>
              onPageChange(Math.max(currentPage - 1, 1))
            }
          />
        </PaginationItem>

        {/* First page */}
        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(1)}
                isActive={currentPage === 1}
              >
                1
              </PaginationLink>
            </PaginationItem>

            {startPage > 2 && (
              <PaginationItem>
                <span className="px-2 text-muted-foreground">…</span>
              </PaginationItem>
            )}
          </>
        )}

        {/* Visible pages */}
        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              isActive={currentPage === page}
              onClick={() => onPageChange(page)}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Last page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <PaginationItem>
                <span className="px-2 text-muted-foreground">…</span>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationLink
                onClick={() => onPageChange(totalPages)}
                isActive={currentPage === totalPages}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            onClick={() =>
              onPageChange(
                Math.min(currentPage + 1, totalPages),
              )
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
