import type {
  GetLearnPageDataInput,
  GetLearnPageDataResponse,
  LearningFilterValues,
} from '@/server/learn/types'
import { getEnrolledBatchesForUser } from '@/server/learn/services/getEnrolledBatches.service'
import { getBatchLearningData } from '@/server/learn/services/getBatchLearningData.service'
import { LEARN_LISTING_PAGE_SIZE } from '@/server/learn/utils/learnListingConstants'
import { resolveListingPagination } from '@/server/learn/utils/resolveListingPagination'

const EMPTY_FILTER_VALUES: LearningFilterValues = {
  moduleFilterValues: [],
  categoryFilterValues: [],
  typeFilterValues: [],
  priorityFilterValues: [],
  instructorFilterValues: [],
}

/**
 * Picks the requested batch when the user is enrolled in it, otherwise the most
 * recently enrolled batch — the first entry, since `getEnrolledBatchesForUser`
 * orders newest enrolment first. Mirrors the client's fallback in `/learn` so the
 * first paint and the URL the client settles on agree.
 */
function resolveSelectedBatchId(
  requestedBatchId: number | undefined,
  enrolledBatchIds: Array<number>,
): number {
  if (requestedBatchId != null && enrolledBatchIds.includes(requestedBatchId)) {
    return requestedBatchId
  }
  return enrolledBatchIds[0]
}

/**
 * Single source for the `/learn` page: enrolled batches + the resolved batch's
 * listing data, in one round-trip. Returns an empty listing when the user has no
 * batches so the page can render its empty state without a second request.
 */
export async function getLearnPageData(
  input: GetLearnPageDataInput,
  userId: number,
): Promise<GetLearnPageDataResponse> {
  const batches = await getEnrolledBatchesForUser(userId)

  if (batches.length === 0) {
    return {
      batches: [],
      selectedBatchId: null,
      filterValues: EMPTY_FILTER_VALUES,
      sections: [],
      learningItems: [],
      pagination: resolveListingPagination(
        0,
        input.page ?? 1,
        input.pageSize ?? LEARN_LISTING_PAGE_SIZE,
      ),
    }
  }

  const selectedBatchId = resolveSelectedBatchId(
    input.batchId,
    batches.map((batch) => batch.batchId),
  )

  const data = await getBatchLearningData(
    {
      batchId: selectedBatchId,
      learningType: input.learningType,
      search: input.search,
      page: input.page,
      pageSize: input.pageSize,
      filters: input.filters,
      sectionId: input.sectionId,
      scheduleHorizonDays: input.scheduleHorizonDays,
    },
    userId,
  )

  return { batches, selectedBatchId, ...data }
}
