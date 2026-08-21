'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { submitLectureAiChatFeedback } from '@/lib/api/ai-tutor/lectureAiChatFeedbackApi'

export type LectureAiChatFeedbackRating = 1 | 2 | 3 | 4 | 5

/**
 * Independent reasons the chat can be "active" right now. Each is reported
 * separately (see `reportActivity`) so one source going idle (e.g. the
 * learner stops scrolling) can't clobber another that's still active (e.g.
 * they're mid-stream or typing).
 */
export type LectureAiChatActivitySource = 'compose' | 'scroll'

/** How long the chat must sit idle before the feedback prompt appears. */
const INACTIVITY_DELAY_MS = 15_000

export type UseLectureAiChatFeedbackResult = {
  isVisible: boolean
  chatId: number | null
  isSubmitting: boolean
  submitError: string | null
  /**
   * Call once the assistant's reply to the *first* message of a brand-new
   * thread finishes streaming (eligibility for "new" vs "history" thread is
   * the caller's responsibility — see `useLectureAiChat`'s
   * `onFirstReplyInNewThreadCompleted`). No-ops for a `chatId` already
   * prompted (submitted or skipped) this page visit. Doesn't show the prompt
   * immediately — it appears once the chat has since been inactive for
   * `INACTIVITY_DELAY_MS` (see `reportActivity`).
   */
  notifyFirstReplyCompleted: (chatId: number | null) => void
  /**
   * Reports whether a given source of interaction — composing (a message
   * sent with its reply still pending/streaming, or typing in the composer)
   * or scrolling the message list — is currently active. Sources are tracked
   * independently, so scrolling settling doesn't hide activity from an
   * unrelated in-flight send, and vice versa. The feedback prompt only
   * appears once every source has been inactive for `INACTIVITY_DELAY_MS`
   * following `notifyFirstReplyCompleted`.
   */
  reportActivity: (
    source: LectureAiChatActivitySource,
    isActive: boolean,
  ) => void
  submit: (
    rating: LectureAiChatFeedbackRating,
    feedback?: string,
  ) => Promise<void>
  skip: () => void
}

/**
 * Per-conversation feedback prompt for the new Lecture AI Chat text
 * experience (spec: docs/AI_CHAT_FEEDBACK.md). Becomes eligible once the AI's
 * reply to the first message of a newly-started thread completes — not for
 * threads reopened from history — and is then shown after the chat has been
 * inactive (no in-flight send, nothing typed in the composer, no scrolling
 * the message list) for `INACTIVITY_DELAY_MS`. At most once per `chatId` per
 * page visit.
 */
export function useLectureAiChatFeedback(
  lectureId: number,
): UseLectureAiChatFeedbackResult {
  const [chatId, setChatId] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submittedChatIdsRef = useRef(new Set<number>())
  const dismissedChatIdsRef = useRef(new Set<number>())
  // Eligible chatId awaiting its inactivity window; cleared once shown,
  // submitted, or skipped.
  const pendingChatIdRef = useRef<number | null>(null)
  // Currently-active interaction sources (see `LectureAiChatActivitySource`);
  // "active" overall iff this set is non-empty.
  const activeSourcesRef = useRef(new Set<LectureAiChatActivitySource>())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const scheduleShow = useCallback(() => {
    clearTimer()
    const pendingChatId = pendingChatIdRef.current
    if (pendingChatId == null || activeSourcesRef.current.size > 0) return

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (pendingChatIdRef.current !== pendingChatId) return
      setChatId(pendingChatId)
      setSubmitError(null)
      setIsVisible(true)
    }, INACTIVITY_DELAY_MS)
  }, [clearTimer])

  const notifyFirstReplyCompleted = useCallback(
    (nextChatId: number | null) => {
      if (nextChatId == null) return
      if (submittedChatIdsRef.current.has(nextChatId)) return
      if (dismissedChatIdsRef.current.has(nextChatId)) return

      pendingChatIdRef.current = nextChatId
      scheduleShow()
    },
    [scheduleShow],
  )

  const reportActivity = useCallback(
    (source: LectureAiChatActivitySource, isActive: boolean) => {
      const sources = activeSourcesRef.current
      if (isActive) {
        sources.add(source)
        clearTimer()
      } else {
        sources.delete(source)
        if (sources.size === 0) scheduleShow()
      }
    },
    [clearTimer, scheduleShow],
  )

  useEffect(() => clearTimer, [clearTimer])

  const submit = useCallback(
    async (rating: LectureAiChatFeedbackRating, feedback?: string) => {
      if (chatId == null) return

      setIsSubmitting(true)
      setSubmitError(null)
      try {
        await submitLectureAiChatFeedback({
          lectureId,
          chatId,
          rating,
          feedback,
        })
        submittedChatIdsRef.current.add(chatId)
        pendingChatIdRef.current = null
        setIsVisible(false)
      } catch {
        setSubmitError('Failed to submit. Please try again or skip.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [chatId, lectureId],
  )

  const skip = useCallback(() => {
    if (chatId != null) {
      dismissedChatIdsRef.current.add(chatId)
    }
    pendingChatIdRef.current = null
    setIsVisible(false)
    setSubmitError(null)
  }, [chatId])

  return {
    isVisible,
    chatId,
    isSubmitting,
    submitError,
    notifyFirstReplyCompleted,
    reportActivity,
    submit,
    skip,
  }
}
