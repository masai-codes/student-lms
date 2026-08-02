import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getInterviewMaxAudioBytes } from '@/server/api/interviews/constants'
import type { InterviewAnswerInput } from '@/server/api/interviews/services/buildInterviewPrompt'
import { submitInterviewTurn } from '@/server/api/interviews/services/submitInterviewTurn.service'

function parseSessionId(raw: string | undefined): number {
  const parsed = Number(raw)
  if (!raw || !Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, 'INTERVIEW_SESSION_ID_INVALID')
  }
  return parsed
}

async function parseAnswer(request: Request): Promise<InterviewAnswerInput> {
  const form = await request.formData().catch(() => null)
  if (!form) throw new ApiError(400, 'INTERVIEW_ANSWER_EMPTY')

  const audio = form.get('audio')
  const typedAnswer = form.get('typedAnswer')

  if (audio instanceof File && audio.size > 0) {
    if (audio.size > getInterviewMaxAudioBytes()) {
      throw new ApiError(400, 'INTERVIEW_ANSWER_AUDIO_TOO_LARGE')
    }
    const buffer = Buffer.from(await audio.arrayBuffer())
    return { kind: 'audio', base64: buffer.toString('base64'), format: 'wav' }
  }

  if (typeof typedAnswer === 'string' && typedAnswer.trim()) {
    return { kind: 'typed', text: typedAnswer.trim() }
  }

  throw new ApiError(400, 'INTERVIEW_ANSWER_EMPTY')
}

export async function handleSubmitInterviewTurn(
  request: Request,
  sessionIdParam: string | undefined,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const sessionId = parseSessionId(sessionIdParam)
    const answer = await parseAnswer(request)

    const result = await submitInterviewTurn({ userId, sessionId, answer })
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to submit interview turn', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_SUBMITTING_INTERVIEW_TURN'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
