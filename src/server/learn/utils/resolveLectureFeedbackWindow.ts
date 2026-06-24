import {
  FEEDBACK_CLOSE_HOURS_AFTER_CONCLUDE,
  FEEDBACK_OPEN_MINUTES_AFTER_START,
} from '@/server/learn/utils/lectureScheduleConstants'

function toTimestamp(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

/**
 * Whether the lecture feedback form is open for submission.
 * Legacy LMS behaviour: gated by `settings.show_feedback`, opens
 * `schedule + 15min`, closes `concludes + 24h` (falls back to `schedule + 24h`).
 */
export function resolveLectureFeedbackWindow(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
  showFeedback: boolean
}): boolean {
  if (!input.showFeedback) return false

  const scheduleMs = toTimestamp(input.schedule)
  if (scheduleMs == null) return false

  const openFromMs = scheduleMs + FEEDBACK_OPEN_MINUTES_AFTER_START * 60 * 1000
  const baseCloseMs = toTimestamp(input.concludes) ?? scheduleMs
  const closeAtMs =
    baseCloseMs + FEEDBACK_CLOSE_HOURS_AFTER_CONCLUDE * 60 * 60 * 1000

  return input.nowMs >= openFromMs && input.nowMs < closeAtMs
}
