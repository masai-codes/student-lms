import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'
import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'
import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'
import type {
  EnrolledBatch,
  GetBatchLearningDataInput,
  GetBatchLearningDataResponse,
} from '@/server/learn/types'

function buildBatchLearningQuery(input: GetBatchLearningDataInput): string {
  const params = new URLSearchParams()
  params.set('batchId', String(input.batchId))
  params.set('learningType', input.learningType)

  if (input.search) params.set('search', input.search)
  if (input.page) params.set('page', String(input.page))
  if (input.pageSize) params.set('pageSize', String(input.pageSize))
  if (input.filters) params.set('filters', JSON.stringify(input.filters))

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

type EnrolledBatchesResponse = { batches: Array<EnrolledBatch> }

export async function fetchEnrolledBatchesFromApi(): Promise<Array<EnrolledBatch>> {
  const { batches } = await fetchJson<EnrolledBatchesResponse>(LEARN_API.batches)
  return batches
}

export async function fetchBatchLearningDataFromApi(
  input: GetBatchLearningDataInput,
): Promise<GetBatchLearningDataResponse> {
  const query = buildBatchLearningQuery(input)
  return fetchJson<GetBatchLearningDataResponse>(`${LEARN_API.batchData}?${query}`)
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

export async function fetchResourceLearningDetailFromApi(
  resourceId: number,
): Promise<ResourceDetailPayload> {
  return fetchLearnApi<ResourceDetailPayload>(LEARN_API.resource(resourceId))
}
