import { joinSessionButtonVisible } from '@/server/learn/utils/joinSessionButtonVisibility'

/** True when the live session window has ended (legacy `joinSessionButtonVisible === 'ended'`). */
export function isLectureSessionEnded(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
}): boolean {
  if (input.schedule == null || input.concludes == null) {
    return false
  }

  return (
    joinSessionButtonVisible(input.schedule, input.concludes, input.nowMs) ===
    'ended'
  )
}
