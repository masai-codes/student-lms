import {
  JOIN_UI_ACTIVE_MINUTES_BEFORE_START,
  JOIN_UI_VISIBLE_MINUTES_BEFORE_START,
} from '@/server/learn/utils/lectureScheduleConstants'
import { parseIstToMs } from '@/server/time/istClock'

export type JoinLiveButtonState = 'hidden' | 'disabled' | 'active'

export function resolveJoinLiveButtonState(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
  zoomLink: string | null
}): JoinLiveButtonState {
  if (!input.zoomLink?.trim()) return 'hidden'

  const scheduleMs = parseIstToMs(input.schedule)
  const concludesMs = parseIstToMs(input.concludes)
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
