import {
  JOIN_UI_ACTIVE_MINUTES_BEFORE_START,
  JOIN_UI_VISIBLE_MINUTES_BEFORE_START,
} from '@/server/learn/utils/lectureScheduleConstants'

/**
 * Legacy LMS join-session visibility (`experience-ui` `LectureButtonVisibility.ts`).
 * Returns `active` | `visible` | `ended` | '' (hidden before the visible window).
 */
export function joinSessionButtonVisible(
  scheduledTime: string,
  concludedTime: string,
  serverTimeMs: number,
): 'active' | 'visible' | 'ended' | '' {
  const beforeLectureButtonVisibilityTime =
    JOIN_UI_VISIBLE_MINUTES_BEFORE_START * 60 * 1000
  const lectureScheduledTime = new Date(scheduledTime).getTime()
  const lectureConcludedTime = new Date(concludedTime).getTime()

  if (lectureConcludedTime >= serverTimeMs) {
    if (
      serverTimeMs >
      lectureScheduledTime - JOIN_UI_ACTIVE_MINUTES_BEFORE_START * 60 * 1000
    ) {
      return 'active'
    }
    if (serverTimeMs > lectureScheduledTime - beforeLectureButtonVisibilityTime) {
      return 'visible'
    }
    return ''
  }

  return 'ended'
}
