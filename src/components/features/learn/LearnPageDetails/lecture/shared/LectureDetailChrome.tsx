'use client'

import { LectureDetailOverviewHeader } from '../meta'
import type { ReactNode } from 'react'

import { LectureAttendanceBanner } from '@/components/features/learn/attendance/LectureAttendanceBanner'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearningPriority } from '@/server/learn/types'
import { resolveLectureAttendanceBanner } from '@/lib/lecture-attendance/resolveLectureAttendanceBanner'
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
  watchPercentage,
  actions,
  hero,
  belowHero,
  footer,
}: LectureDetailChromeProps) {
  const attendanceBanner = resolveLectureAttendanceBanner(attendance, watchPercentage)
  return (
    <div className="w-full pb-12">
      <section className="flex w-full shrink-0 flex-col overflow-visible bg-white">
        {hero}
        <div
          data-lecture-viewport-chrome
          className={cn(lectureDetailContentClasses, 'relative z-20 shrink-0')}
        >
          <LectureDetailOverviewHeader
            title={title}
            tags={tags}
            priority={priority}
            hostName={hostName}
            avatarUrl={hostAvatarUrl}
            dateRange={scheduleDisplayRange}
            dateRangeIst={scheduleDisplayRangeIst}
            attendance={attendance}
            optionalAttendance={optionalAttendance}
            watchPercentage={watchPercentage}
            actions={actions}
          />
          {attendanceBanner ? (
            <LectureAttendanceBanner banner={attendanceBanner} />
          ) : null}
          {belowHero}
        </div>
      </section>
      {footer ? (
        <div className={cn(lectureDetailContentClasses, 'bg-white')}>{footer}</div>
      ) : null}
    </div>
  )
}
