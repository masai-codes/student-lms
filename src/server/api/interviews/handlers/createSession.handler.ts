import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parseTopicId } from '@/server/api/interviews/handlers/parseCreateSessionRequest'
import { createInterviewSession } from '@/server/api/interviews/services/interviewSession.service'

export async function handleCreateInterviewSession(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const topicId = await parseTopicId(request)

    const result = await createInterviewSession(userId, topicId)
    return jsonOk(result, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to create interview session', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_CREATING_INTERVIEW_SESSION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
