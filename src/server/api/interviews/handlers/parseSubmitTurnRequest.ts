import { ApiError } from '@/server/api/http/apiError'
import type { InterviewAnswerInput } from '@/server/api/interviews/services/buildInterviewPrompt'

/** Shared request parsing for both the blocking and streaming submit-turn routes. */
export function parseSessionId(raw: string | undefined): number {
  const parsed = Number(raw)
  if (!raw || !Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, 'INTERVIEW_SESSION_ID_INVALID')
  }
  return parsed
}

export async function parseAnswer(
  request: Request,
): Promise<InterviewAnswerInput> {
  const form = await request.formData().catch(() => null)
  if (!form) throw new ApiError(400, 'INTERVIEW_ANSWER_EMPTY')

  const typedAnswer = form.get('typedAnswer')
  const transcribedAnswer = form.get('transcribedAnswer')

  if (typeof transcribedAnswer === 'string' && transcribedAnswer.trim()) {
    return { kind: 'transcribed', text: transcribedAnswer.trim() }
  }

  if (typeof typedAnswer === 'string' && typedAnswer.trim()) {
    return { kind: 'typed', text: typedAnswer.trim() }
  }

  throw new ApiError(400, 'INTERVIEW_ANSWER_EMPTY')
}
