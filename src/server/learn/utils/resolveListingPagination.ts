import type { LearningPagination } from '@/server/learn/types'

/**
 * Resolves the pagination envelope for a listing. `page` is clamped into
 * `[1, totalPages]` so an out-of-range request returns the last page (legacy LMS).
 */
export function resolveListingPagination(
  totalItems: number,
  page: number,
  pageSize: number,
): LearningPagination {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  }
}
