import type {
  GetBatchLearningDataInput,
  GetBatchLearningDataResponse,
  LearningItem,
} from '@/server/learn/types'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearningEntityRow } from '@/server/learn/utils/learningDataMappers'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type { AssignmentListingPage } from '@/server/learn/queries/fetchAssignmentListingPage'
import { getSectionIdsForUserInBatch } from '@/server/batches/getSectionIdsForUserInBatch'
import { getUserBatchBans } from '@/server/users/batchBan'
import { fetchLectureAttendanceSummaries } from '@/server/attendance/services/fetchLectureAttendanceSummaries'
import { buildLearnListingCardCtas } from '@/server/learn/utils/buildLearnListingCardCtas'
import { buildLearnScheduleWindow } from '@/server/learn/utils/buildLearnScheduleWindow'
import {
  mapLearningEntityRow,
  toLearningPriority,
} from '@/server/learn/utils/learningDataMappers'
import {
  LEARN_LISTING_MAX_PAGE_SIZE,
  LEARN_LISTING_PAGE_SIZE,
} from '@/server/learn/utils/learnListingConstants'
import { resolveAssignmentPhase } from '@/server/learn/utils/resolveAssignmentPhase'
import { fetchAssignmentListingPage } from '@/server/learn/queries/fetchAssignmentListingPage'
import { fetchLearnListingFacets } from '@/server/learn/queries/fetchLearnListingFacets'
import { fetchLectureListingPage } from '@/server/learn/queries/fetchLectureListingPage'

function normalizePagination(page?: number, pageSize?: number) {
  const safePage = Number.isFinite(page) && page != null && page > 0 ? page : 1
  const safePageSize =
    Number.isFinite(pageSize) && pageSize != null && pageSize > 0
      ? Math.min(pageSize, LEARN_LISTING_MAX_PAGE_SIZE)
      : LEARN_LISTING_PAGE_SIZE
  return { page: safePage, pageSize: safePageSize }
}

async function fetchAttendanceForRows(
  userId: number,
  rows: Array<LearningEntityRow>,
): Promise<Map<number, LectureAttendanceSummary>> {
  return fetchLectureAttendanceSummaries(
    userId,
    rows
      .filter((row) => row.sectionId != null)
      .map((row) => ({
        lectureId: row.id,
        sectionId: row.sectionId!,
        schedule: row.schedule,
        concludes: row.concludes ?? null,
        optional: row.optional,
      })),
  )
}

function mapRowToItem(
  row: LearningEntityRow,
  input: GetBatchLearningDataInput,
  nowMs: number,
  attendance: LectureAttendanceSummary | null,
  assignmentProgressStatus: AssignmentProgressStatus | null,
): LearningItem {
  const listingCtas = buildLearnListingCardCtas({
    learningType: input.learningType,
    lectureId: row.id,
    itemType: row.type,
    schedule: row.schedule,
    concludes: row.concludes ?? null,
    isMandatory: toLearningPriority(row.optional) === 'mandatory',
    zoomLink: row.zoomLink ?? null,
    isNewZoomRedirection: row.isNewZoomRedirection === 1,
    nowMs,
    attendance,
    assignmentProgressStatus,
  })

  const resourcePhase =
    input.learningType === 'resource'
      ? resolveAssignmentPhase({
          schedule: row.schedule,
          concludes: row.concludes ?? null,
          nowMs,
        })
      : null

  return mapLearningEntityRow(
    row,
    input.learningType,
    listingCtas,
    attendance,
    assignmentProgressStatus,
    resourcePhase,
  )
}

export async function getBatchLearningData(
  input: GetBatchLearningDataInput,
  userId: number,
): Promise<GetBatchLearningDataResponse> {
  const { page, pageSize } = normalizePagination(input.page, input.pageSize)
  const nowMs = Date.now()
  const [sectionIds, bans] = await Promise.all([
    getSectionIdsForUserInBatch(userId, input.batchId),
    getUserBatchBans(userId),
  ])

  const window = buildLearnScheduleWindow({
    learningType: input.learningType,
    schedulePhase: input.filters?.schedulePhase,
    scheduleStartDate: input.filters?.scheduleStartDate,
    scheduleEndDate: input.filters?.scheduleEndDate,
    nowMs,
  })

  const conditions = {
    learningType: input.learningType,
    batchId: input.batchId,
    sectionIds,
    userId,
    filters: input.filters,
    window,
    search: input.search,
    nowMs,
    // Normal-ban: hide items scheduled after the ban date in this banned batch.
    bannedScheduleCutoff: bans.normalByBatch.get(input.batchId),
  }

  const [filterValues, pageResult] = await Promise.all([
    fetchLearnListingFacets(input.learningType, sectionIds, nowMs),
    input.learningType === 'assignment'
      ? fetchAssignmentListingPage({ ...conditions, page, pageSize })
      : fetchLectureListingPage({ ...conditions, page, pageSize }),
  ])

  const attendanceByLectureId =
    input.learningType === 'lecture'
      ? await fetchAttendanceForRows(userId, pageResult.rows)
      : new Map<number, LectureAttendanceSummary>()

  const progressById =
    input.learningType === 'assignment'
      ? (pageResult as AssignmentListingPage).progressById
      : new Map<number, AssignmentProgressStatus>()

  const learningItems = pageResult.rows.map((row) =>
    mapRowToItem(
      row,
      input,
      nowMs,
      attendanceByLectureId.get(row.id) ?? null,
      progressById.get(row.id) ?? null,
    ),
  )

  return { filterValues, learningItems, pagination: pageResult.pagination }
}
