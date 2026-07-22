import type { GetLearnPageDataInput } from '@/server/learn/types'
import { fetchLearnPageDataFromApi } from '@/lib/api/learn/learnApi'

export const LEARN_KEYS = {
  all: ['learn'] as const,
  page: (input: GetLearnPageDataInput) =>
    [
      'learn',
      'page',
      input.batchId ?? null,
      input.learningType,
      input.search ?? '',
      input.page ?? 1,
      input.pageSize ?? null,
      input.filters?.types?.join(',') ?? '',
    ] as const,
}

/** Paginated learn listing — same payload as the `/learn` page. */
export const learnPageQuery = (input: GetLearnPageDataInput) => ({
  queryKey: LEARN_KEYS.page(input),
  queryFn: () => fetchLearnPageDataFromApi(input),
  staleTime: 30 * 1000,
})
