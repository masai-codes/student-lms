import { ApiError } from '@/server/api/http/apiError'
import { getInterviewMaxAudioBytes } from '@/server/api/interviews/constants'
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
