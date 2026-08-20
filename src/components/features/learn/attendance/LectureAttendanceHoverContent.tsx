import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { ListingAttendanceVisibleState } from '@/lib/lecture-attendance/types'

export function formatCatchUpHoverMessage(daysRemaining: number): string {
  return `Catch up on this lecture within the next ${daysRemaining} days`
}

export const ATT_WINDOW_OVER_HOVER_MESSAGE =
  'The catch up window to claim your attendance is over, hence you are marked absent'

type LectureAttendanceHoverContentProps = {
  attendance: LectureAttendanceSummary
  /** `live`/`scrum` lectures show the "Live:" line; `video` lectures omit it. */
  isLiveLecture: boolean
  uiState: ListingAttendanceVisibleState
  daysRemaining: number | null
  /** Icon-only badges always show the breakdown (their label is hidden). */
  iconOnly: boolean
}

/**
 * The ONE hover tooltip for every attendance status a lecture card / detail
 * header shows (worded badges, icon-only tick/cross, and the bare countdown):
 *
 * - Absent / Continue Watching with catch-up days left (worded) →
 *   "Catch up on this lecture within the next {X} days"
 * - Everything else → the Live/Video breakdown:
 *   "Live: Attended|Not Attended" (live/scrum only) +
 *   "Video: Watched|Not Watched", and for Att. Window Over an extra line
 *   explaining the window has closed.
 */
export function LectureAttendanceHoverContent({
  attendance,
  isLiveLecture,
  uiState,
  daysRemaining,
  iconOnly,
}: LectureAttendanceHoverContentProps) {
  const showCatchUpOnly =
    !iconOnly &&
    daysRemaining != null &&
    daysRemaining > 0 &&
    (uiState === 'absent' || uiState === 'continue_watching')

  if (showCatchUpOnly) {
    return <p>{formatCatchUpHoverMessage(daysRemaining)}</p>
  }

  const liveLine =
    attendance.liveAttendanceStatus === 1 ? 'Attended' : 'Not Attended'
  const videoLine =
    attendance.videoAttendanceStatus === 1 ? 'Watched' : 'Not Watched'

  return (
    <div className="flex flex-col gap-1">
      {isLiveLecture ? <div>Live: {liveLine}</div> : null}
      <div>Video: {videoLine}</div>
      {uiState === 'att_window_over' ? (
        <p className="mt-1">{ATT_WINDOW_OVER_HOVER_MESSAGE}</p>
      ) : null}
    </div>
  )
}
