import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'
import { streamSubmitInterviewTurn } from '@/lib/api/interviews/streamSubmitInterviewTurn'
import { createInterviewAudioPlayer } from '@/lib/audio/interviewAudioPlayer'
import {
  interviewSessionQuery,
  interviewSessionQueryKey,
} from '@/query/interviews/interviewSessionQuery'

const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  INTERVIEW_RESPONSE_EMPTY:
    "The interviewer didn't respond — please try again.",
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
 * The submit itself streams the interviewer's spoken response as audio
 * (`streamSubmitInterviewTurn`) and plays it as it arrives via a PCM audio
 * player, rather than waiting on the full turn to complete first.
 */
export function useInterviewSession(sessionId: number) {
  const queryClient = useQueryClient()
  const query = useQuery(interviewSessionQuery(sessionId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<ReturnType<
    typeof createInterviewAudioPlayer
  > | null>(null)

  async function submitAnswer(answer: SubmitInterviewAnswerInput) {
    setIsSubmitting(true)
    setError(null)

    playerRef.current?.cancel()
    const player = createInterviewAudioPlayer()
    playerRef.current = player

    const outcome = await new Promise<
      { status: 'done' } | { status: 'error'; code: string }
    >((resolve) => {
      streamSubmitInterviewTurn(sessionId, answer, {
        onAudioDelta: (data) => {
          player.pushChunk(data)
        },
        onDone: () => {
          player.finish()
          resolve({ status: 'done' })
        },
        onError: (code) => {
          player.cancel()
          resolve({ status: 'error', code })
        },
      })
    })

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
    error,
    submitAnswer,
    clearError: () => setError(null),
  }
}
