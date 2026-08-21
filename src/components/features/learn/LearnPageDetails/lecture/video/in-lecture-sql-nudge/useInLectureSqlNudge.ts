'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { InLecturePopupSqlSandboxElement } from '@/server/learn/lectureDetailTypes'

/**
 * Per-entry, in-session status (nothing is persisted) — mirrors
 * `useInLectureQuiz`'s status machine: `idle` (ready to fire), `active`
 * (card is showing), `closed` (fired/dismissed this pass; re-arms once
 * playback leaves the window).
 */
type NudgeStatus = 'idle' | 'active' | 'closed'

/**
 * How long after `executedAtSec` the nudge stays eligible to fire once.
 * `sqlSandbox` entries have no end timestamp (unlike quiz/poll windows), so
 * this is a fixed show-window rather than something read off the data.
 */
const NUDGE_WINDOW_SEC = 20

/** How long the card stays up before auto-dismissing. */
const NUDGE_CARD_DISPLAY_MS = 7_000

type UseInLectureSqlNudgeOptions = {
  sqlSandbox: Array<InLecturePopupSqlSandboxElement>
  /** Live playback position in seconds (`attendance.progress`). */
  progressSeconds: number
  /**
   * Only one of the (possibly dual-mounted, see `useHasLayoutBox`) player
   * instances should ever fire a nudge — pass `ownsInLecturePopups` through.
   */
  enabled: boolean
}

function isInside(entry: InLecturePopupSqlSandboxElement, at: number): boolean {
  if (entry.executedAtSec === null) return false
  return (
    at >= entry.executedAtSec && at < entry.executedAtSec + NUDGE_WINDOW_SEC
  )
}

/**
 * Nudges the viewer toward the SQL Playground as playback crosses a moment
 * the instructor ran a query live — exposes `activeEntry` for the caller to
 * render a small dismissible card (`SqlPlaygroundNudgeCard`), anchored over
 * the video canvas. Fullscreen or not, the card renders the same way (it's a
 * plain absolutely-positioned child of the video container, which is itself
 * the fullscreen root while fullscreen — see `SqlPlaygroundNudgeCard`).
 */
export function useInLectureSqlNudge({
  sqlSandbox,
  progressSeconds,
  enabled,
}: UseInLectureSqlNudgeOptions) {
  const entries = useMemo(
    () => sqlSandbox.filter((entry) => entry.executedAtSec !== null),
    [sqlSandbox],
  )

  // In-session status only — no seeding from storage.
  const statusRef = useRef<Map<number, NudgeStatus>>(new Map())
  const statuses = statusRef.current
  const cardTimeoutRef = useRef<number | null>(null)

  const [activeId, setActiveId] = useState<number | null>(null)

  const getStatus = useCallback(
    (id: number): NudgeStatus => statuses.get(id) ?? 'idle',
    [statuses],
  )

  const clearCardTimeout = useCallback(() => {
    if (cardTimeoutRef.current !== null) {
      window.clearTimeout(cardTimeoutRef.current)
      cardTimeoutRef.current = null
    }
  }, [])

  const closeActiveCard = useCallback(
    (id: number) => {
      statuses.set(id, 'closed')
      clearCardTimeout()
      setActiveId(null)
    },
    [statuses, clearCardTimeout],
  )

  /** Explicit dismiss (the card's own close button or "Open" action). */
  const dismissNudge = useCallback(() => {
    if (activeId === null) return
    closeActiveCard(activeId)
  }, [activeId, closeActiveCard])

  // Position-based detection (race-free), same approach as quiz/poll: a
  // nudge is eligible exactly while playback is inside its window.
  useEffect(() => {
    if (!enabled) {
      if (activeId !== null) closeActiveCard(activeId)
      return
    }

    const curr = progressSeconds

    // Re-arm `closed` entries once playback has left their window.
    for (const entry of entries) {
      if (getStatus(entry.id) === 'closed' && !isInside(entry, curr)) {
        statuses.set(entry.id, 'idle')
      }
    }

    // Auto-dismiss the open card once playback leaves its window (the fixed
    // 7s display timer, below, is the other way it can close).
    if (activeId !== null) {
      const active = entries.find((entry) => entry.id === activeId)
      if (active && isInside(active, curr)) return
      closeActiveCard(activeId)
      // Fall through: a different entry's window may contain playback now.
    }

    for (const entry of entries) {
      if (getStatus(entry.id) !== 'idle') continue
      if (!isInside(entry, curr)) continue

      statuses.set(entry.id, 'active')
      setActiveId(entry.id)
      clearCardTimeout()
      cardTimeoutRef.current = window.setTimeout(() => {
        closeActiveCard(entry.id)
      }, NUDGE_CARD_DISPLAY_MS)
      break
    }
  }, [
    enabled,
    progressSeconds,
    entries,
    activeId,
    getStatus,
    statuses,
    closeActiveCard,
    clearCardTimeout,
  ])

  // Clear any pending timer on unmount (route change / player teardown).
  useEffect(() => clearCardTimeout, [clearCardTimeout])

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeId) ?? null,
    [entries, activeId],
  )

  return { activeEntry, dismissNudge }
}
