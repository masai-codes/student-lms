'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  normalizeInLectureQuizzes,
  type NormalizedInLectureQuiz,
} from './normalizeInLectureQuizzes'
import type { InLecturePopupQuizElement } from '@/server/learn/lectureDetailTypes'

/**
 * Per-quiz, in-session status (nothing is persisted).
 * - `idle`   — ready to open whenever its window contains playback
 * - `active` — modal currently open
 * - `closed` — dismissed/skipped this pass; stays closed while still inside the
 *              window, then re-arms to `idle` once playback leaves it
 *
 * There are intentionally NO terminal outcome states: a quiz re-opens every time
 * its window is (re-)entered, regardless of any earlier submit/auto-submit.
 */
type QuizStatus = 'idle' | 'active' | 'closed'

/** Outcome the modal reports once the quiz resolves (not persisted). */
export type QuizResolution = 'auto_submitted' | 'submitted' | 'stopped'

type UseInLectureQuizOptions = {
  lectureId: number
  quizzes: Array<InLecturePopupQuizElement>
  /** Live playback position in seconds (`attendance.progress`). */
  progressSeconds: number
  /** Video duration in seconds, once known (used to validate/clamp windows). */
  totalDuration: number
  /** Bumped on every user seek. Retained for API compatibility; unused. */
  seekSignal: number
  /**
   * "Skip to lecture": seek the player to `toSeconds`, and mark the skipped
   * `[fromSeconds, toSeconds)` range as watched for attendance purposes —
   * the quiz's whole window counts even though playback never covered it.
   */
  onSkipToSeconds: (fromSeconds: number, toSeconds: number) => void
}

type UseInLectureQuizResult = {
  /** The quiz whose modal is currently open, or `null`. */
  activeQuiz: NormalizedInLectureQuiz | null
  /** Report the resolved outcome (does not close the modal; not persisted). */
  resolveQuiz: (outcome: QuizResolution) => void
  /** Seek to the window end and close the modal ("skip to lecture"). */
  closeQuiz: () => void
  /** Close the modal without seeking ("continue watching"). */
  dismissQuiz: () => void
}

function isInside(quiz: NormalizedInLectureQuiz, at: number): boolean {
  return at >= quiz.startSec && at < quiz.endSec
}

export function useInLectureQuiz({
  quizzes,
  progressSeconds,
  totalDuration,
  onSkipToSeconds,
}: UseInLectureQuizOptions): UseInLectureQuizResult {
  const normalized = useMemo(
    () => normalizeInLectureQuizzes(quizzes, totalDuration),
    [quizzes, totalDuration],
  )

  // In-session status only — no seeding from storage.
  const statusRef = useRef<Map<string, QuizStatus>>(new Map())
  const statuses = statusRef.current

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)

  const getStatus = useCallback(
    (id: string): QuizStatus => statuses.get(id) ?? 'idle',
    [statuses],
  )

  // Position-based detection (race-free — no dependence on seek timing).
  // A quiz is open exactly while playback is inside its window; leaving the
  // window (by seek or natural playback) closes it so another can open.
  useEffect(() => {
    const curr = progressSeconds

    // Re-arm `closed` quizzes once playback has left their window.
    for (const quiz of normalized) {
      if (getStatus(quiz.id) === 'closed' && !isInside(quiz, curr)) {
        statuses.set(quiz.id, 'idle')
      }
    }

    // Keep the open quiz open only while playback stays inside its window.
    if (activeQuizId !== null) {
      const active = normalized.find((quiz) => quiz.id === activeQuizId)
      if (active && isInside(active, curr)) return
      statuses.set(activeQuizId, 'idle')
      setActiveQuizId(null)
      // Fall through: a different window may contain playback this same tick.
    }

    for (const quiz of normalized) {
      if (getStatus(quiz.id) !== 'idle') continue
      if (isInside(quiz, curr)) {
        statuses.set(quiz.id, 'active')
        setActiveQuizId(quiz.id)
        break
      }
    }
  }, [progressSeconds, normalized, activeQuizId, getStatus, statuses])

  const activeQuiz = useMemo(
    () => normalized.find((quiz) => quiz.id === activeQuizId) ?? null,
    [normalized, activeQuizId],
  )

  // Outcomes are not persisted. The modal stays open (showing its resolved
  // state) via `activeQuizId`; this is the hook point where server-side
  // persistence will live later.
  const resolveQuiz = useCallback((_outcome: QuizResolution) => {}, [])

  // Closing marks the quiz `closed`: it won't immediately re-open while still
  // inside the window, but re-arms to `idle` (and re-opens) on re-entry.
  const closeActiveQuiz = useCallback(() => {
    if (activeQuizId === null) return
    statuses.set(activeQuizId, 'closed')
    setActiveQuizId(null)
  }, [activeQuizId, statuses])

  /** "Skip to lecture" — seek past the window, then close. */
  const closeQuiz = useCallback(() => {
    if (activeQuizId === null) return
    const quiz = normalized.find((q) => q.id === activeQuizId)
    if (quiz) onSkipToSeconds(quiz.startSec, quiz.endSec)
    closeActiveQuiz()
  }, [activeQuizId, normalized, onSkipToSeconds, closeActiveQuiz])

  /** "Continue watching" — close without seeking; playback carries on as-is. */
  const dismissQuiz = useCallback(() => {
    closeActiveQuiz()
  }, [closeActiveQuiz])

  return { activeQuiz, resolveQuiz, closeQuiz, dismissQuiz }
}
