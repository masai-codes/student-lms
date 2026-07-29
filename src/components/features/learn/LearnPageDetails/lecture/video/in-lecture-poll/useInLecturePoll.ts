'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  normalizeInLecturePolls,
  type NormalizedInLecturePoll,
} from './normalizeInLecturePolls'
import type { InLecturePopupPollElement } from '@/server/learn/lectureDetailTypes'

/**
 * Per-poll, in-session status (nothing is persisted client-side — the
 * submission itself is persisted server-side in `zef_lms_polls_submissions`).
 * - `idle`   — ready to open whenever its window contains playback
 * - `active` — modal currently open
 * - `closed` — dismissed/skipped this pass; stays closed while still inside the
 *              window, then re-arms to `idle` once playback leaves it
 *
 * Mirrors `useInLectureQuiz`: a poll re-opens every time its window is
 * (re-)entered, regardless of any earlier submit — the modal itself detects
 * an existing submission and renders its read-only state.
 */
type PollStatus = 'idle' | 'active' | 'closed'

type UseInLecturePollOptions = {
  polls: Array<InLecturePopupPollElement>
  /** Live playback position in seconds (`attendance.progress`). */
  progressSeconds: number
  /** Video duration in seconds, once known (used to validate/clamp windows). */
  totalDuration: number
  /** Seek the player to a position (used by "skip to lecture"). */
  onSeekToSeconds: (seconds: number) => void
}

type UseInLecturePollResult = {
  /** The poll whose modal is currently open, or `null`. */
  activePoll: NormalizedInLecturePoll | null
  /** Seek to the window end and close the modal ("skip to lecture"). */
  closePoll: () => void
  /** Close the modal without seeking ("continue watching"). */
  dismissPoll: () => void
}

function isInside(poll: NormalizedInLecturePoll, at: number): boolean {
  return at >= poll.startSec && at < poll.endSec
}

export function useInLecturePoll({
  polls,
  progressSeconds,
  totalDuration,
  onSeekToSeconds,
}: UseInLecturePollOptions): UseInLecturePollResult {
  const normalized = useMemo(
    () => normalizeInLecturePolls(polls, totalDuration),
    [polls, totalDuration],
  )

  // In-session status only — no seeding from storage.
  const statusRef = useRef<Map<string, PollStatus>>(new Map())
  const statuses = statusRef.current

  const [activePollId, setActivePollId] = useState<string | null>(null)

  const getStatus = useCallback(
    (id: string): PollStatus => statuses.get(id) ?? 'idle',
    [statuses],
  )

  // Position-based detection (race-free — no dependence on seek timing).
  // A poll is open exactly while playback is inside its window; leaving the
  // window (by seek or natural playback) closes it so another can open.
  useEffect(() => {
    const curr = progressSeconds

    // Re-arm `closed` polls once playback has left their window.
    for (const poll of normalized) {
      if (getStatus(poll.id) === 'closed' && !isInside(poll, curr)) {
        statuses.set(poll.id, 'idle')
      }
    }

    // Keep the open poll open only while playback stays inside its window.
    if (activePollId !== null) {
      const active = normalized.find((poll) => poll.id === activePollId)
      if (active && isInside(active, curr)) return
      statuses.set(activePollId, 'idle')
      setActivePollId(null)
      // Fall through: a different window may contain playback this same tick.
    }

    for (const poll of normalized) {
      if (getStatus(poll.id) !== 'idle') continue
      if (isInside(poll, curr)) {
        statuses.set(poll.id, 'active')
        setActivePollId(poll.id)
        break
      }
    }
  }, [progressSeconds, normalized, activePollId, getStatus, statuses])

  const activePoll = useMemo(
    () => normalized.find((poll) => poll.id === activePollId) ?? null,
    [normalized, activePollId],
  )

  // Closing marks the poll `closed`: it won't immediately re-open while still
  // inside the window, but re-arms to `idle` (and re-opens) on re-entry.
  const closeActivePoll = useCallback(() => {
    if (activePollId === null) return
    statuses.set(activePollId, 'closed')
    setActivePollId(null)
  }, [activePollId, statuses])

  /** "Skip to lecture" — seek past the window, then close. */
  const closePoll = useCallback(() => {
    if (activePollId === null) return
    const poll = normalized.find((p) => p.id === activePollId)
    if (poll) onSeekToSeconds(poll.endSec)
    closeActivePoll()
  }, [activePollId, normalized, onSeekToSeconds, closeActivePoll])

  /** "Continue watching" — close without seeking; playback carries on as-is. */
  const dismissPoll = useCallback(() => {
    closeActivePoll()
  }, [closeActivePoll])

  return { activePoll, closePoll, dismissPoll }
}
