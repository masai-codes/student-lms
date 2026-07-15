'use client'

import { LectureDetailOverviewHeader } from '../meta'
import type { ReactNode } from 'react'

import { LectureAttendanceBanner } from '@/components/features/learn/attendance/LectureAttendanceBanner'
import { LectureCatchupProgressBar } from '@/components/features/learn/attendance/LectureCatchupProgressBar'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearningPriority } from '@/server/learn/types'
import { resolveLectureAttendanceBanner } from '@/lib/lecture-attendance/resolveLectureAttendanceBanner'
import { resolveLectureCatchUpProgress } from '@/lib/lecture-attendance/resolveLectureCatchUpProgress'
import { lectureDetailContentClasses } from '@/lib/layout'
import { cn } from '@/lib/utils'

type LectureDetailChromeProps = {
  title: string
  tags: Array<string>
  priority: LearningPriority
  hostName: string
  hostAvatarUrl: string | null
  scheduleDisplayRange: string
  scheduleDisplayRangeIst?: string
  attendance: LectureAttendanceSummary | null
  /** Set only for optional (recommended) lectures; renders the info tooltip. */
  optionalAttendance?: LectureAttendanceSummary | null
  /**
   * Render the blue "watch the recording to become Present" / "only live counts"
   * attendance disclaimer. Only the recording experience passes `true` — the
   * before/during/no-recording fallbacks must not, since there is no recording
   * to watch yet and the message would be misleading.
   */
  showAttendanceBanner?: boolean
  /** `live`/`scrum` lecture — shows the Live line in the attendance breakdown. */
  isLiveLecture: boolean
  watchPercentage?: number | null
  /** Header CTAs (Raise Ticket + bookmark) rendered in the overview header. */
  actions?: ReactNode
  hero: ReactNode
  belowHero?: ReactNode
  footer?: ReactNode
}

export function LectureDetailChrome({
  title,
  tags,
  priority,
  hostName,
  hostAvatarUrl,
  scheduleDisplayRange,
  scheduleDisplayRangeIst,
  attendance,
  optionalAttendance,
  isLiveLecture,
  watchPercentage,
  showAttendanceBanner = false,
  actions,
  hero,
  belowHero,
  footer,
}: LectureDetailChromeProps) {
  // The banner intentionally does NOT depend on live `watchPercentage` — it
  // tracks the server-reconciled attendance state only (legacy parity), so it
  // does not vanish ~30s into playback. `watchPercentage` still drives the live
  // header badge below.
  const attendanceBanner = showAttendanceBanner
    ? resolveLectureAttendanceBanner(attendance)
    : null
  // Mid-catch-up (`continue_watching`, recording counts): the banner steps aside
  // for the dark catch-up progress strip — legacy parity. Mutually exclusive
  // with the banner by construction (the banner resolves to null for that state).
  const catchUpProgress =
    showAttendanceBanner && attendanceBanner == null
      ? resolveLectureCatchUpProgress(attendance)
      : null
  return (
    <div className="w-full pb-12">
      <section className="flex w-full shrink-0 flex-col overflow-visible bg-surface dark:bg-transparent">
        {hero}
        <div
          data-lecture-viewport-chrome
          className={cn(lectureDetailContentClasses, 'relative z-20 shrink-0')}
        >
          {/* Content below the video rises in with a gentle stagger (header →
              attendance banner → footer). The hero stays untouched — its
              heights are JS-measured. */}
          <LectureDetailOverviewHeader
            className="animate-dash-rise"
            title={title}
            tags={tags}
            priority={priority}
            hostName={hostName}
            avatarUrl={hostAvatarUrl}
            dateRange={scheduleDisplayRange}
            dateRangeIst={scheduleDisplayRangeIst}
            attendance={attendance}
            optionalAttendance={optionalAttendance}
            isLiveLecture={isLiveLecture}
            watchPercentage={watchPercentage}
            actions={actions}
          />
          {attendanceBanner ? (
            <div className="mb-4 animate-dash-rise [--dash-delay:0.08s]">
              <LectureAttendanceBanner banner={attendanceBanner} />
            </div>
          ) : catchUpProgress ? (
            <div className="mb-4 animate-dash-rise [--dash-delay:0.08s]">
              <LectureCatchupProgressBar
                progress={catchUpProgress}
                watchPercentage={attendance?.watchPercentage ?? 0}
              />
            </div>
          ) : null}
          {belowHero}
        </div>
      </section>
      {footer ? (
        <div
          className={cn(
            lectureDetailContentClasses,
            'animate-dash-rise bg-surface dark:bg-transparent [--dash-delay:0.16s]',
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
