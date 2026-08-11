import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { submitPracticeQuestionAnswers } from '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service'

type SubmitAnswersBody = {
  chatId?: unknown
  quizId?: unknown
  answers?: unknown
}

function parsePositiveInt(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function parseAnswers(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(400, 'AI_TUTOR_QUIZ_ANSWERS_INVALID')
  }
  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.some(([, answer]) => typeof answer !== 'string')) {
    throw new ApiError(400, 'AI_TUTOR_QUIZ_ANSWERS_INVALID')
  }
  return Object.fromEntries(entries) as Record<string, string>
}

function parseBody(body: SubmitAnswersBody | null): {
  chatId: number
  quizId: string
  answers: Record<string, string>
} {
  const chatId = parsePositiveInt(body?.chatId)
  if (!chatId) {
    throw new ApiError(400, 'AI_TUTOR_CHAT_ID_INVALID')
  }

  const quizId = typeof body?.quizId === 'string' ? body.quizId : ''
  if (!quizId) {
    throw new ApiError(400, 'AI_TUTOR_QUIZ_ID_INVALID')
  }

  return { chatId, quizId, answers: parseAnswers(body?.answers) }
}

export async function handleSubmitPracticeQuestionAnswers(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request
      .json()
      .catch(() => null)) as SubmitAnswersBody | null
    const parsed = parseBody(body)

    await submitPracticeQuestionAnswers({ userId, ...parsed })

    return jsonOk({ chatId: parsed.chatId, quizId: parsed.quizId })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to submit practice question answers', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_SUBMITTING_AI_TUTOR_QUIZ_ANSWERS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
