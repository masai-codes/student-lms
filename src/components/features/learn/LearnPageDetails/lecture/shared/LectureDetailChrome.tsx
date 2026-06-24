'use client'

import { LectureDetailOverviewHeader } from '../meta'
import type { ReactNode } from 'react'

import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearningPriority } from '@/server/learn/types'
import { lectureDetailContentClasses } from '@/lib/layout'
import { cn } from '@/lib/utils'

type LectureDetailChromeProps = {
  title: string
  tags: Array<string>
  priority: LearningPriority
  hostName: string
  hostAvatarUrl: string | null
  scheduleDisplayRange: string
  attendance: LectureAttendanceSummary | null
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
  attendance,
  watchPercentage,
  actions,
  hero,
  belowHero,
  footer,
}: LectureDetailChromeProps) {
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
            attendance={attendance}
            watchPercentage={watchPercentage}
            actions={actions}
          />
          {belowHero}
        </div>
      </section>
      {footer ? (
        <div className={cn(lectureDetailContentClasses, 'bg-white')}>{footer}</div>
      ) : null}
    </div>
  )
}
