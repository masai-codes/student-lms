import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'
import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'
import type { ProblemDetailPayload } from '@/server/learn/utils/buildProblemDetailPayload'
import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'
import type {
  BatchLearningFiltersInput,
  GetLearnPageDataInput,
  GetLearnPageDataResponse,
} from '@/server/learn/types'
import { LEARN_API } from '@/lib/api/learnPaths'
import { fetchJson } from '@/lib/api/fetchJson'
import { ApiClientError } from '@/lib/api/apiClientError'

function appendCsv(params: URLSearchParams, key: string, values?: Array<string>): void {
  if (values && values.length > 0) params.set(key, values.join(','))
}

function appendFilters(params: URLSearchParams, filters?: BatchLearningFiltersInput): void {
  if (!filters) return
  appendCsv(params, 'modules', filters.modules)
  appendCsv(params, 'categories', filters.categories)
  appendCsv(params, 'types', filters.types)
  appendCsv(params, 'priorities', filters.priorities)
  appendCsv(params, 'instructors', filters.instructors)
  if (filters.scheduleStartDate) params.set('scheduleStartDate', filters.scheduleStartDate)
  if (filters.scheduleEndDate) params.set('scheduleEndDate', filters.scheduleEndDate)
  if (filters.schedulePhase) params.set('schedulePhase', filters.schedulePhase)
  if (filters.attendanceStatus) params.set('attendanceStatus', filters.attendanceStatus)
  appendCsv(params, 'assignmentProgress', filters.assignmentProgressStatuses)
}

function buildLearnPageQuery(input: GetLearnPageDataInput): string {
  const params = new URLSearchParams()
  params.set('learningType', input.learningType)
  if (input.batchId != null) params.set('batchId', String(input.batchId))
  if (input.search) params.set('search', input.search)
  if (input.page) params.set('page', String(input.page))
  if (input.pageSize) params.set('pageSize', String(input.pageSize))
  appendFilters(params, input.filters)
  return params.toString()
}

async function fetchLearnApi<T>(path: string): Promise<T> {
  try {
    return await fetchJson<T>(path)
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.code)
    }
    throw error
  }
}

export async function fetchLearnPageDataFromApi(
  input: GetLearnPageDataInput,
): Promise<GetLearnPageDataResponse> {
  return fetchLearnApi<GetLearnPageDataResponse>(`${LEARN_API.page}?${buildLearnPageQuery(input)}`)
}

export async function fetchLectureLearningDetailFromApi(
  lectureId: number,
): Promise<LectureDetailPayload> {
  return fetchLearnApi<LectureDetailPayload>(LEARN_API.lecture(lectureId))
}

export async function fetchAssignmentLearningDetailFromApi(
  assignmentId: number,
): Promise<AssignmentDetailPayload> {
  return fetchLearnApi<AssignmentDetailPayload>(LEARN_API.assignment(assignmentId))
}

export async function fetchProblemDetailFromApi(
  assignmentId: number,
  problemId: number,
): Promise<ProblemDetailPayload> {
  return fetchLearnApi<ProblemDetailPayload>(
    LEARN_API.problem(assignmentId, problemId),
  )
}

export async function fetchResourceLearningDetailFromApi(
  resourceId: number,
): Promise<ResourceDetailPayload> {
  return fetchLearnApi<ResourceDetailPayload>(LEARN_API.resource(resourceId))
}

export interface ResourceBookmarkResult {
  isBookmarked: boolean
}

export async function addResourceBookmarkViaApi(
  resourceId: number,
): Promise<ResourceBookmarkResult> {
  return fetchJson<ResourceBookmarkResult>(LEARN_API.resourceBookmark(resourceId), {
    method: 'POST',
  })
}

export async function removeResourceBookmarkViaApi(
  resourceId: number,
): Promise<ResourceBookmarkResult> {
  return fetchJson<ResourceBookmarkResult>(LEARN_API.resourceBookmark(resourceId), {
    method: 'DELETE',
  })
}

export interface AssignmentBookmarkResult {
  isBookmarked: boolean
}

export async function addAssignmentBookmarkViaApi(
  assignmentId: number,
): Promise<AssignmentBookmarkResult> {
  return fetchJson<AssignmentBookmarkResult>(
    LEARN_API.assignmentBookmark(assignmentId),
    { method: 'POST' },
  )
}

export async function removeAssignmentBookmarkViaApi(
  assignmentId: number,
): Promise<AssignmentBookmarkResult> {
  return fetchJson<AssignmentBookmarkResult>(
    LEARN_API.assignmentBookmark(assignmentId),
    { method: 'DELETE' },
  )
}

export interface LectureBookmarkResult {
  isBookmarked: boolean
}

export async function addLectureBookmarkViaApi(
  lectureId: number,
): Promise<LectureBookmarkResult> {
  return fetchJson<LectureBookmarkResult>(LEARN_API.lectureBookmark(lectureId), {
    method: 'POST',
  })
}

export async function removeLectureBookmarkViaApi(
  lectureId: number,
): Promise<LectureBookmarkResult> {
  return fetchJson<LectureBookmarkResult>(LEARN_API.lectureBookmark(lectureId), {
    method: 'DELETE',
  })
}
