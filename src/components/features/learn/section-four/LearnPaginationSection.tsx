import {
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

export function LearnPaginationSection({
  currentPage,
  totalPages,
  onPageChange,
}: LearnPaginationSectionProps) {
  return (
    <section>
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

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
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
          ))}

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
