'use client'

import { useCallback, useRef, useState } from 'react'

import { submitLectureAiChatFeedback } from '@/lib/api/ai-tutor/lectureAiChatFeedbackApi'

export type LectureAiChatFeedbackRating = 1 | 2 | 3 | 4 | 5

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
   * prompted (submitted or skipped) this page visit.
   */
  notifyFirstReplyCompleted: (chatId: number | null) => void
  submit: (rating: LectureAiChatFeedbackRating, feedback?: string) => Promise<void>
  skip: () => void
}

/**
 * Per-conversation feedback prompt for the new Lecture AI Chat text
 * experience (spec: docs/AI_CHAT_FEEDBACK.md). Shown once the AI's reply to
 * the first message of a newly-started thread completes — not for threads
 * reopened from history, and at most once per `chatId` per page visit.
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

  const notifyFirstReplyCompleted = useCallback((nextChatId: number | null) => {
    if (nextChatId == null) return
    if (submittedChatIdsRef.current.has(nextChatId)) return
    if (dismissedChatIdsRef.current.has(nextChatId)) return

    setChatId(nextChatId)
    setSubmitError(null)
    setIsVisible(true)
  }, [])

  const submit = useCallback(
    async (rating: LectureAiChatFeedbackRating, feedback?: string) => {
      if (chatId == null) return

      setIsSubmitting(true)
      setSubmitError(null)
      try {
        await submitLectureAiChatFeedback({ lectureId, chatId, rating, feedback })
        submittedChatIdsRef.current.add(chatId)
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
    setIsVisible(false)
    setSubmitError(null)
  }, [chatId])

  return {
    isVisible,
    chatId,
    isSubmitting,
    submitError,
    notifyFirstReplyCompleted,
    submit,
    skip,
  }
}
