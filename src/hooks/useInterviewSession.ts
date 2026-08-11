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
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The next question's text as soon as it's known — well before the audio
  // finishes streaming/playing and the DB-backed query gets invalidated.
  // Cleared once the query refetch (below) has the real thing.
  const [pendingQuestion, setPendingQuestion] = useState<{
    text: string
    kind: 'advance' | 'follow_up'
  } | null>(null)
  const playerRef = useRef<ReturnType<
    typeof createInterviewAudioPlayer
  > | null>(null)

  async function submitAnswer(answer: SubmitInterviewAnswerInput) {
    setIsSubmitting(true)
    setError(null)
    setPendingQuestion(null)

    playerRef.current?.cancel()
    const player = createInterviewAudioPlayer()
    playerRef.current = player

    const outcome = await new Promise<
      { status: 'done' } | { status: 'error'; code: string }
    >((resolve) => {
      streamSubmitInterviewTurn(sessionId, answer, {
        onAudioDelta: (data) => {
          setIsSpeaking(true)
          player.pushChunk(data)
        },
        onQuestionText: (text, kind) => {
          setPendingQuestion({ text, kind })
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

    // The SSE stream finishing doesn't mean playback is done — audio is
    // scheduled ahead of real time for gapless playback, so still-queued
    // chunks can keep playing well after the last delta arrives. Wait for
    // the player to confirm everything has actually finished (or been
    // cancelled) before dropping the "speaking" state.
    await new Promise<void>((resolve) => player.onPlaybackEnded(resolve))
    setIsSpeaking(false)

    if (outcome.status === 'done') {
      await queryClient.invalidateQueries({
        queryKey: interviewSessionQueryKey(sessionId),
      })
    } else {
      setError(FRIENDLY_ERROR_MESSAGES[outcome.code] ?? DEFAULT_ERROR_MESSAGE)
    }

    setPendingQuestion(null)
    setIsSubmitting(false)
  }

  function stopSpeaking() {
    playerRef.current?.cancel()
    setIsSpeaking(false)
  }

  return {
    session: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    isSubmitting,
    isSpeaking,
    pendingQuestion,
    error,
    submitAnswer,
    stopSpeaking,
    clearError: () => setError(null),
  }
}
