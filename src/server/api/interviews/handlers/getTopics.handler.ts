import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getInterviewTopicsForUser } from '@/server/api/interviews/services/getInterviewTopics.service'

export async function handleGetInterviewTopics(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const data = await getInterviewTopicsForUser(userId)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch interview topics', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_INTERVIEW_TOPICS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
