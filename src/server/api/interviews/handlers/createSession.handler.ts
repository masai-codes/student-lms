import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createInterviewSession } from '@/server/api/interviews/services/interviewSession.service'

type CreateSessionBody = { topicId?: unknown }

function parseTopicId(body: CreateSessionBody | null): string {
  const topicId = typeof body?.topicId === 'string' ? body.topicId.trim() : ''
  if (!topicId) throw new ApiError(400, 'INTERVIEW_TOPIC_INVALID')
  return topicId
}

export async function handleCreateInterviewSession(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request
      .json()
      .catch(() => null)) as CreateSessionBody | null
    const topicId = parseTopicId(body)

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
