import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { submitAiTutorFeedback } from '@/server/api/ai-tutor/submitAiTutorFeedback.service'
import {
  encodeFeedbackWithPlatform,
  parsePlatform,
  parseRatingForPlatform,
} from '@/server/api/ai-tutor/feedbackPlatform'

type SubmitFeedbackBody = {
  lectureId?: unknown
  chatId?: unknown
  rating?: unknown
  feedback?: unknown
  platform?: unknown
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseFeedbackBody(body: SubmitFeedbackBody | null): {
  lectureId: number
  chatId: number
  rating: number
  feedback: string
} {
  const lectureId = parsePositiveInt(body?.lectureId)
  if (!lectureId) {
    throw new ApiError(400, 'AI_TUTOR_LECTURE_ID_INVALID')
  }

  const chatId = parsePositiveInt(body?.chatId)
  if (!chatId) {
    throw new ApiError(400, 'AI_TUTOR_CHAT_ID_INVALID')
  }

  const platform = parsePlatform(body?.platform)
  const rating = parseRatingForPlatform(body?.rating, platform)
  const userFeedback = typeof body?.feedback === 'string' ? body.feedback : null
  const feedback = encodeFeedbackWithPlatform(platform, userFeedback)

  return { lectureId, chatId, rating, feedback }
}

export async function handleSubmitFeedback(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request
      .json()
      .catch(() => null)) as SubmitFeedbackBody | null
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
