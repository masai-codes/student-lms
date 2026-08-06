'use client'

import { LectureDetailOverviewHeader } from '../meta'
import type { ReactNode } from 'react'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearningPriority } from '@/server/learn/types'
import { resolveLectureAttendanceBanner } from '@/lib/lecture-attendance/resolveLectureAttendanceBanner'
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
  // While the recording is shown (`showAttendanceBanner`, set only by the
  // recording experience), the banner is always visible; its variant depends
  // solely on whether watching the recording counts toward attendance
  // (`videoCountsForAttendance`). It does not depend on watch progress, so it
  // never disappears mid-watch. `optionalAttendance` covers recommended lectures
  // (which have a recording but null `attendance`) so they show it too.
  const attendanceBanner = showAttendanceBanner
    ? resolveLectureAttendanceBanner(attendance ?? optionalAttendance)
    : null
  return (
    // `bg-surface` + `flex-1` on the wrapper, not just on the inner sections:
    // otherwise the `pb-12` tail (and any slack when the page is shorter than
    // the scroll column) shows the shell's muted background as a grey band.
    <div className="flex w-full flex-1 flex-col bg-surface pb-12 dark:bg-transparent">
      <section className="flex w-full shrink-0 flex-col overflow-visible bg-surface dark:bg-transparent">
        {hero}
        <div
          data-lecture-viewport-chrome
          className={cn('w-full px-4 md:px-6', 'relative z-20 shrink-0')}
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
            attendanceBanner={attendanceBanner}
          />
          {belowHero}
        </div>
      </section>
      {footer ? (
        <div
          className={cn(
            'w-full px-4 md:px-6',
            'animate-dash-rise bg-surface dark:bg-transparent [--dash-delay:0.16s]',
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
