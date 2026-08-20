import type { NavbarPillEvent } from '@/server/api/dashboard/getNavbarPill.service'
import { parseMysqlDatetimeIST } from '@/utils/timeZoneHandler'

/**
 * Pure presentation logic for the "next action" banner.
 *
 * The backend (`getNavbarPillEvent`) already picks the single highest-priority
 * event — evaluation > live > scrum, within the schedule−5min → concludes
 * window. This module turns that event + the current time into everything the
 * banner needs to render, so the component stays a thin view and the rules stay
 * testable in isolation. Kept UI-framework-free for reuse (navbar, banner, etc.).
 */

/** How often the banner should re-render to keep its countdown fresh. */
export const EVALUATION_TICK_MS = 1_000
export const LECTURE_TICK_MS = 30_000

type NextActionCta = 'Start' | 'View'

export interface NextActionBannerView {
  event: NavbarPillEvent
  /** True once the event's start time has passed (still before it concludes). */
  isStarted: boolean
  /** Short status label, e.g. "Upcoming lecture" / "Evaluation has started". */
  label: string
  /** Milliseconds until start; `null` once the event has started. */
  countdownMs: number | null
  /** Evaluations count down to the second; lectures round to whole minutes. */
  precise: boolean
  /** Call-to-action copy. */
  ctaText: NextActionCta
  /** Re-render cadence for a live countdown (finer for evaluations). */
  tickMs: number
}

/**
 * Resolve the banner view for the current moment.
 *
 * Returns `null` when there is nothing to show — no event, unparseable
 * timestamps, or the event has already concluded.
 */
export function resolveNextActionBannerView(
  event: NavbarPillEvent | null | undefined,
  nowMs: number,
): NextActionBannerView | null {
  if (!event) return null

  const startMs = parseMysqlDatetimeIST(event.schedule)?.valueOf()
  const endMs = parseMysqlDatetimeIST(event.concludes)?.valueOf()
  if (startMs == null || endMs == null) return null

  // Already concluded — the backend window is generous, so gate on the client too.
  if (nowMs >= endMs) return null

  const isEvaluation = event.eventType === 'evaluation'
  const isStarted = nowMs >= startMs

  const noun = isEvaluation ? 'Evaluation' : 'Lecture'
  const label = isStarted
    ? `${noun} has started`
    : `Upcoming ${noun.toLowerCase()}`

  return {
    event,
    isStarted,
    label,
    countdownMs: isStarted ? null : Math.max(0, startMs - nowMs),
    precise: isEvaluation,
    ctaText: isEvaluation ? 'Start' : 'View',
    tickMs: isEvaluation ? EVALUATION_TICK_MS : LECTURE_TICK_MS,
  }
}

/**
 * Format a countdown for display.
 * - `precise` (evaluations): `MM:SS`
 * - otherwise (lectures): `N mins` (rounded up, min 1)
 */
export function formatCountdown(ms: number, precise: boolean): string {
  const clamped = Math.max(0, ms)
  if (precise) {
    const totalSecs = Math.floor(clamped / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  const mins = Math.max(1, Math.ceil(clamped / 60_000))
  return `${mins} mins`
}
