import { MasaiPagination } from '@/components/ui/masai-pagination'
import { pushLearnEvent } from '../shared/learnAnalytics'

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
    <section className="my-8 flex w-full justify-center">
      <MasaiPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          pushLearnEvent('l_learn_page_change', {
            page,
            total_pages: totalPages,
          })
          onPageChange(page)
        }}
        ariaLabel="Learning items pagination"
      />
    </section>
  )
}
