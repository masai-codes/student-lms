'use client'

import type { CreateLearnDiscussionKind } from '@/server/new-discussions/services/createDiscussionForLearnEntity'
import { MasaiPagination } from '@/components/ui/masai-pagination'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

type LectureDiscussionPaginationProps = {
  entityId: number
  entityKind: CreateLearnDiscussionKind
  page: number
  totalPages: number
  filteredCount: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function LectureDiscussionPagination({
  entityId,
  entityKind,
  page,
  totalPages,
  filteredCount,
  pageSize,
  onPageChange,
}: LectureDiscussionPaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, filteredCount)

  const handlePageChange = (next: number) => {
    pushLearnEvent('l_learn_discussion_page_change', {
      entity_id: entityId,
      entity_kind: entityKind,
      page: next,
    })
    onPageChange(next)
  }

  return (
    <div
      data-testid="discussion-pagination"
      className="mt-4 flex flex-col items-center gap-2"
    >
      <MasaiPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        ariaLabel="Discussions pagination"
      />
      <p
        data-testid="discussion-pagination-summary"
        className="type-caption-regular text-gray-500"
      >
        Showing {from}&ndash;{to} of {filteredCount}
      </p>
    </div>
  )
}
