import { LECTURE_ATTENDANCE_STATUS_META } from '@/lib/lecture-attendance/lectureAttendanceStatus'
import type { LectureAttendanceSummary } from '@/server/attendance/types'

/**
 * Live / Recording / Overall attendance breakdown shown inside the
 * optional-session info tooltip (mirrors the old LMS). The badge hovers use
 * `LectureAttendanceHoverContent` instead.
 */
export function AttendanceBreakdownContent({
  attendance,
  isLiveLecture,
}: {
  attendance: LectureAttendanceSummary
  /**
   * `live`/`scrum` lectures show the "Live - Attended/Not Attended" line; video
   * lectures omit it since there's no live session to attend.
   */
  isLiveLecture: boolean
}) {
  const isPresent = attendance.overallStatus === 1
  const liveStatus =
    attendance.liveAttendanceStatus === 1 ? 'Attended' : 'Not Attended'
  const videoStatus =
    attendance.videoAttendanceStatus === 1 ? 'Watched' : 'Not Watched'

  if (!attendance.includeVideoAttendance) {
    return <p className="italic">Only live class attendance is considered.</p>
  }

  // Non-mandatory batches (`batches.is_attendance_mandatory = 0`) suppress the
  // "Overall - Absent" verdict: attendance isn't required, so an Absent pill
  // would read as a penalty. "Overall - Present" still shows.
  const showOverall = isPresent || attendance.isAttendanceMandatory

  return (
    <div className="flex flex-col gap-2">
      {isLiveLecture ? <div>Live - {liveStatus}</div> : null}
      <div>Recording - {videoStatus}</div>
      {showOverall ? (
        <div>
          <span
            className={
              isPresent
                ? 'inline-flex items-center rounded-full bg-success-subtle px-2 py-0.5 type-t1 font-medium text-success-subtle-foreground'
                : 'inline-flex items-center rounded-full bg-danger-subtle px-2 py-0.5 type-t1 font-medium text-danger-subtle-foreground'
            }
          >
            Overall -{' '}
            {isPresent
              ? LECTURE_ATTENDANCE_STATUS_META.present.label
              : LECTURE_ATTENDANCE_STATUS_META.absent.label}
          </span>
        </div>
      ) : null}
    </div>
  )
}
