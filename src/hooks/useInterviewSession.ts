import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'
import { streamSubmitInterviewTurn } from '@/lib/api/interviews/streamSubmitInterviewTurn'
import { createInterviewQuestionSpeaker } from '@/lib/speech/interviewQuestionSpeaker'
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
 *
 * The submit itself streams the next question from the model as it's
 * generated (`streamSubmitInterviewTurn`) instead of blocking on the full
 * completion — `streamingQuestion` accumulates that live text so callers can
 * show/speak it well before the turn (and the query invalidation) finishes.
 */
export function useInterviewSession(sessionId: number) {
  const queryClient = useQueryClient()
  const query = useQuery(interviewSessionQuery(sessionId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingQuestion, setStreamingQuestion] = useState('')
  const speakerRef = useRef<ReturnType<
    typeof createInterviewQuestionSpeaker
  > | null>(null)

  async function submitAnswer(answer: SubmitInterviewAnswerInput) {
    setIsSubmitting(true)
    setError(null)
    setStreamingQuestion('')

    speakerRef.current?.cancel()
    const speaker = createInterviewQuestionSpeaker()
    speakerRef.current = speaker

    const outcome = await new Promise<
      { status: 'done' } | { status: 'error'; code: string }
    >((resolve) => {
      streamSubmitInterviewTurn(sessionId, answer, {
        onQuestionDelta: (text) => {
          speaker.pushText(text)
          setStreamingQuestion((prev) => prev + text)
        },
        onDone: () => {
          speaker.finish()
          resolve({ status: 'done' })
        },
        onError: (code) => {
          speaker.cancel()
          resolve({ status: 'error', code })
        },
      })
    })

    setStreamingQuestion('')
    if (outcome.status === 'done') {
      await queryClient.invalidateQueries({
        queryKey: interviewSessionQueryKey(sessionId),
      })
    } else {
      setError(FRIENDLY_ERROR_MESSAGES[outcome.code] ?? DEFAULT_ERROR_MESSAGE)
    }

    setIsSubmitting(false)
  }

  return {
    session: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    isSubmitting,
    streamingQuestion,
    error,
    submitAnswer,
    clearError: () => setError(null),
  }
}
