import {
  PaginationEllipsis,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface LearnPaginationSectionProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getVisiblePages(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([
    1,
    Math.max(1, currentPage - 1),
    currentPage,
    Math.min(totalPages, currentPage + 1),
    totalPages,
  ])

  const sortedPages = Array.from(pages).sort((a, b) => a - b)
  const visiblePages: Array<number | 'ellipsis'> = []

  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index]
    const previousPage = sortedPages[index - 1]

    if (previousPage != null && page - previousPage > 1) {
      visiblePages.push('ellipsis')
    }

    visiblePages.push(page)
  }

  return visiblePages
}

export function LearnPaginationSection({
  currentPage,
  totalPages,
  onPageChange,
}: LearnPaginationSectionProps) {
  const visiblePages = getVisiblePages(currentPage, totalPages)

  return (
    <section className="mb-8">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault()
                onPageChange(Math.max(1, currentPage - 1))
              }}
            />
          </PaginationItem>

          {visiblePages.map((page, index) =>
            page === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={(event) => {
                    event.preventDefault()
                    onPageChange(page)
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault()
                onPageChange(Math.min(totalPages, currentPage + 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </section>
  )
}
