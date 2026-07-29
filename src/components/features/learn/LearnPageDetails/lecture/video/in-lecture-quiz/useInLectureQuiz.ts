'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  normalizeInLectureQuizzes,
  type NormalizedInLectureQuiz,
} from './normalizeInLectureQuizzes'
import {
  loadLectureQuizStatuses,
  saveLectureQuizStatus,
} from './inLectureQuizStorage'
import type { InLecturePopupQuiz } from '@/server/learn/lectureDetailTypes'

/**
 * Per-quiz lifecycle.
 * - `idle`          — not yet shown, ready to open
 * - `active`        — modal currently open
 * - `auto_submitted`— resolved by the 7s client-side auto-submit; terminal
 * - `submitted`     — Assess Platform confirmed a real submission via webhook;
 *                     terminal, same as `auto_submitted` (a stronger signal
 *                     that can preempt any other phase, including `countdown`)
 * - `stopped`       — user stopped the auto-submit; re-arms to `idle` once
 *                     playback leaves the window, so it re-shows on a revisit
 *                     (but not instantly while still inside the window)
 * - `missed`        — scrubbed clean over the window without opening (session only)
 */
type QuizStatus =
  | 'idle'
  | 'active'
  | 'auto_submitted'
  | 'submitted'
  | 'stopped'
  | 'missed'

/** Outcome the modal reports once the quiz resolves. */
export type QuizResolution = 'auto_submitted' | 'submitted' | 'stopped'

type UseInLectureQuizOptions = {
  lectureId: number
  quizzes: Array<InLecturePopupQuiz>
  /** Live playback position in seconds (`attendance.progress`). */
  progressSeconds: number
  /** Video duration in seconds, once known (used to validate/clamp windows). */
  totalDuration: number
  /**
   * A value that changes on every user seek (`attendance.seekNonce`). Used to
   * distinguish a deliberate scrub from natural playback so an open quiz only
   * closes when the user drags OUT of its window — not when playback rolls past.
   */
  seekSignal: number
  /** Seek the player to a position (used by "skip to lecture"). */
  onSeekToSeconds: (seconds: number) => void
}

type UseInLectureQuizResult = {
  /** The quiz whose modal is currently open, or `null`. */
  activeQuiz: NormalizedInLectureQuiz | null
  /** Persist the resolved outcome (does not close the modal). */
  resolveQuiz: (outcome: QuizResolution) => void
  /** Seek to the window end and close the modal ("skip to lecture"). */
  closeQuiz: () => void
  /** Close the modal without seeking ("continue watching"). */
  dismissQuiz: () => void
}

export function useInLectureQuiz({
  lectureId,
  quizzes,
  progressSeconds,
  totalDuration,
  seekSignal,
  onSeekToSeconds,
}: UseInLectureQuizOptions): UseInLectureQuizResult {
  const normalized = useMemo(
    () => normalizeInLectureQuizzes(quizzes, totalDuration),
    [quizzes, totalDuration],
  )

  // Seed statuses once, synchronously, from localStorage: `auto_submitted` and
  // `submitted` are terminal, so they're the only stored outcomes that block a
  // re-show. `stopped` is intentionally NOT seeded terminal — it re-shows.
  const statusRef = useRef<Map<string, QuizStatus> | null>(null)
  if (statusRef.current === null) {
    const stored = loadLectureQuizStatuses(lectureId)
    const seeded = new Map<string, QuizStatus>()
    for (const [id, status] of Object.entries(stored)) {
      if (status === 'auto_submitted' || status === 'submitted') {
        seeded.set(id, status)
      }
    }
    statusRef.current = seeded
  }
  const statuses = statusRef.current

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)
  // `null` until the first observed tick, so the initial position can only OPEN
  // a window it lands inside — never be mistaken for a "jumped-over" seek.
  const prevProgressRef = useRef<number | null>(null)
  const prevSeekSignalRef = useRef(seekSignal)

  const getStatus = useCallback(
    (id: string): QuizStatus => statuses.get(id) ?? 'idle',
    [statuses],
  )

  // Edge-triggered detection. `prev → curr` tells natural playback / seek-into a
  // window (open it) apart from a seek that jumps clean over an un-opened window
  // (mark missed). Only `idle` quizzes can open, so `auto_submitted`/`missed`
  // never re-fire, while a `stopped` quiz (which stays `idle`) does.
  useEffect(() => {
    const isFirstTick = prevProgressRef.current === null
    const prev = prevProgressRef.current ?? progressSeconds
    const curr = progressSeconds
    prevProgressRef.current = curr

    const didSeek = seekSignal !== prevSeekSignalRef.current
    prevSeekSignalRef.current = seekSignal

    // Re-arm `stopped` quizzes once playback has left their window, so a later
    // revisit re-opens them (but they don't re-open while still inside).
    for (const quiz of normalized) {
      if (getStatus(quiz.id) !== 'stopped') continue
      const inside = curr >= quiz.startSec && curr < quiz.endSec
      if (!inside) statuses.set(quiz.id, 'idle')
    }

    // A quiz is open: only one shows at a time, so nothing else can open. But if
    // the user SEEKS out of the active window, dismiss it (without seeking back).
    // Natural playback rolling past the window keeps it open (e.g. the post
    // auto-submit "skip" prompt), since only a real scrub flips `didSeek`.
    if (activeQuizId !== null) {
      const active = normalized.find((quiz) => quiz.id === activeQuizId)
      const insideActive =
        active != null && curr >= active.startSec && curr < active.endSec
      if (didSeek && !insideActive) {
        // Leave an unresolved quiz re-showable; keep a resolved status as-is.
        if (getStatus(activeQuizId) === 'active') {
          statuses.set(activeQuizId, 'idle')
        }
        setActiveQuizId(null)
      }
      return
    }

    for (const quiz of normalized) {
      if (getStatus(quiz.id) !== 'idle') continue

      const inside = curr >= quiz.startSec && curr < quiz.endSec
      const jumpedOver =
        !isFirstTick && prev < quiz.startSec && curr >= quiz.endSec

      if (inside) {
        statuses.set(quiz.id, 'active')
        setActiveQuizId(quiz.id)
        break
      }
      if (jumpedOver) {
        statuses.set(quiz.id, 'missed')
      }
    }
  }, [progressSeconds, seekSignal, normalized, activeQuizId, getStatus, statuses])

  const activeQuiz = useMemo(
    () => normalized.find((quiz) => quiz.id === activeQuizId) ?? null,
    [normalized, activeQuizId],
  )

  const resolveQuiz = useCallback(
    (outcome: QuizResolution) => {
      if (activeQuizId === null) return
      saveLectureQuizStatus(lectureId, activeQuizId, outcome)
      // The modal stays open (showing the resolved state); the status records
      // the outcome. `stopped` re-arms to `idle` once playback leaves the window.
      statuses.set(activeQuizId, outcome)
    },
    [activeQuizId, lectureId, statuses],
  )

  // Shared close bookkeeping: closing without ever resolving (shouldn't
  // normally happen) leaves the quiz re-showable; a resolved status is kept.
  const closeActiveQuiz = useCallback(() => {
    if (activeQuizId === null) return
    if (getStatus(activeQuizId) === 'active') statuses.set(activeQuizId, 'idle')
    setActiveQuizId(null)
  }, [activeQuizId, getStatus, statuses])

  /** "Skip to lecture" — seek past the window, then close. */
  const closeQuiz = useCallback(() => {
    if (activeQuizId === null) return
    const quiz = normalized.find((q) => q.id === activeQuizId)
    if (quiz) onSeekToSeconds(quiz.endSec)
    closeActiveQuiz()
  }, [activeQuizId, normalized, onSeekToSeconds, closeActiveQuiz])

  /** "Continue watching" — close without seeking; playback carries on as-is. */
  const dismissQuiz = useCallback(() => {
    closeActiveQuiz()
  }, [closeActiveQuiz])

  return { activeQuiz, resolveQuiz, closeQuiz, dismissQuiz }
}
