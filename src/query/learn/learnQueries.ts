import type {
  BatchLearningFiltersInput,
  GetLearnPageDataInput,
} from '@/server/learn/types'
import { fetchLearnPageDataFromApi } from '@/lib/api/learn/learnApi'

/** Stable cache-key fragment so every applied learn filter triggers a distinct query. */
export function serializeLearnPageFiltersKey(
  filters?: BatchLearningFiltersInput,
): string {
  if (!filters) return ''
  return JSON.stringify({
    modules: filters.modules?.join(',') ?? '',
    categories: filters.categories?.join(',') ?? '',
    types: filters.types?.join(',') ?? '',
    priorities: filters.priorities?.join(',') ?? '',
    instructors: filters.instructors?.join(',') ?? '',
    scheduleStartDate: filters.scheduleStartDate ?? '',
    scheduleEndDate: filters.scheduleEndDate ?? '',
    schedulePhase: filters.schedulePhase ?? '',
    attendanceStatus: filters.attendanceStatus ?? '',
    assignmentProgressStatuses:
      filters.assignmentProgressStatuses?.join(',') ?? '',
  })
}

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
      input.sectionId ?? null,
      serializeLearnPageFiltersKey(input.filters),
    ] as const,
}

/** Paginated learn listing — same payload as the `/learn` page. */
export const learnPageQuery = (input: GetLearnPageDataInput) => ({
  queryKey: LEARN_KEYS.page(input),
  queryFn: () => fetchLearnPageDataFromApi(input),
  staleTime: 30 * 1000,
})
