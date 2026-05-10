import { MasaiPagination } from '@/components/ui/masai-pagination'

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
  if (totalPages <= 1) return null

  return (
    <section className="mb-8 flex w-full justify-center">
      <MasaiPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        ariaLabel="Learning items pagination"
      />
    </section>
  )
}
