import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/lib/api/apiClientError'
import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'
import { submitInterviewTurn } from '@/lib/api/interviews/interviewsApi'
import {
  interviewSessionQuery,
  interviewSessionQueryKey,
} from '@/query/interviews/interviewSessionQuery'

const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  INTERVIEW_TRANSCRIPT_EMPTY:
    "We couldn't make out your answer — please re-record and try again.",
  INTERVIEW_ANSWER_AUDIO_TOO_LARGE:
    'That recording is too long. Please keep answers under the time limit.',
  INTERVIEW_ANSWER_EMPTY: 'Record an answer or type one before submitting.',
  INTERVIEW_SESSION_NOT_IN_PROGRESS: 'This interview has already ended.',
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.'

/**
 * Owns the turn-submission side effect for an active interview session.
 * Session state itself (turns, status, report) is the query cache — after a
 * successful submit we simply invalidate it so the next question / report
 * comes from the DB, rather than hand-maintaining a parallel copy client-side.
 */
export function useInterviewSession(sessionId: number) {
  const queryClient = useQueryClient()
  const query = useQuery(interviewSessionQuery(sessionId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitAnswer(answer: SubmitInterviewAnswerInput) {
    setIsSubmitting(true)
    setError(null)
    try {
      await submitInterviewTurn(sessionId, answer)
      await queryClient.invalidateQueries({
        queryKey: interviewSessionQueryKey(sessionId),
      })
    } catch (err) {
      const code = err instanceof ApiClientError ? err.code : null
      setError((code && FRIENDLY_ERROR_MESSAGES[code]) ?? DEFAULT_ERROR_MESSAGE)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    session: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    isSubmitting,
    error,
    submitAnswer,
    clearError: () => setError(null),
  }
}
