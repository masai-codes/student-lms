import type { LectureAttendanceSummary } from '@/server/attendance/types'

/**
 * Live / Recording / Overall attendance breakdown shown inside a tooltip
 * (mirrors the old LMS). Shared by the mandatory-lecture attendance badge and
 * the optional-session info icon so both surfaces read identically.
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

  return (
    <div className="flex flex-col gap-2">
      {isLiveLecture ? <div>Live - {liveStatus}</div> : null}
      <div>Recording - {videoStatus}</div>
      <div>
        <span
          className={
            isPresent
              ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 type-t1 font-medium text-emerald-700'
              : 'inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 type-t1 font-medium text-rose-600'
          }
        >
          Overall - {isPresent ? 'Present' : 'Absent'}
        </span>
      </div>
    </div>
  )
}
