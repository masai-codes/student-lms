import {
  JOIN_UI_ACTIVE_MINUTES_BEFORE_START,
  JOIN_UI_VISIBLE_MINUTES_BEFORE_START,
} from '@/server/learn/utils/lectureScheduleConstants'

export type JoinLiveButtonState = 'hidden' | 'disabled' | 'active'

function toTimestamp(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

export function resolveJoinLiveButtonState(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
  zoomLink: string | null
}): JoinLiveButtonState {
  if (!input.zoomLink?.trim()) return 'hidden'

  const scheduleMs = toTimestamp(input.schedule)
  const concludesMs = toTimestamp(input.concludes)
  if (scheduleMs == null) return 'hidden'

  const visibleFromMs =
    scheduleMs - JOIN_UI_VISIBLE_MINUTES_BEFORE_START * 60 * 1000
  const activeFromMs =
    scheduleMs - JOIN_UI_ACTIVE_MINUTES_BEFORE_START * 60 * 1000

  if (input.nowMs < visibleFromMs) return 'hidden'
  if (concludesMs != null && input.nowMs > concludesMs) return 'hidden'
  if (input.nowMs < activeFromMs) return 'disabled'
  return 'active'
}
