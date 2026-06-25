import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { submitAiTutorFeedback } from '@/server/api/ai-tutor/submitAiTutorFeedback.service'

type SubmitFeedbackBody = {
  lectureId?: unknown
  chatId?: unknown
  rating?: unknown
  feedback?: unknown
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseRating(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) return null
  return parsed
}

function parseFeedbackBody(body: SubmitFeedbackBody | null): {
  lectureId: number
  chatId: number
  rating: number
  feedback: string | null
} {
  const lectureId = parsePositiveInt(body?.lectureId)
  if (!lectureId) {
    throw new ApiError(400, 'AI_TUTOR_LECTURE_ID_INVALID')
  }

  const chatId = parsePositiveInt(body?.chatId)
  if (!chatId) {
    throw new ApiError(400, 'AI_TUTOR_CHAT_ID_INVALID')
  }

  const rating = parseRating(body?.rating)
  if (rating == null) {
    throw new ApiError(400, 'AI_TUTOR_RATING_INVALID')
  }

  const feedback =
    typeof body?.feedback === 'string' ? body.feedback : null

  return { lectureId, chatId, rating, feedback }
}

export async function handleSubmitFeedback(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = (await request.json().catch(() => null)) as
      | SubmitFeedbackBody
      | null
    const parsed = parseFeedbackBody(body)

    const data = await submitAiTutorFeedback({
      userId,
      lectureId: parsed.lectureId,
      chatId: parsed.chatId,
      rating: parsed.rating,
      feedback: parsed.feedback,
    })

    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to submit ai-tutor feedback', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_SUBMITTING_AI_TUTOR_FEEDBACK'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
