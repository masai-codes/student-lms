import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { listAiTutorConversations } from '@/server/api/ai-tutor/listAiTutorConversations.service'

function parsePositiveInt(value: string | null): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export async function handleListConversations(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveInt(
      new URL(request.url).searchParams.get('lectureId'),
    )

    if (!lectureId) {
      throw new ApiError(400, 'AI_TUTOR_LECTURE_ID_INVALID')
    }

    const data = await listAiTutorConversations({ userId, lectureId })
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to list ai-tutor conversations', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_AI_TUTOR_CONVERSATIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
