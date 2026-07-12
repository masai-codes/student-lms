'use client'

import { lectureDetailTagChipPalette } from './lectureDetailTagChips'
import type { ReactNode } from 'react'


import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearningPriority } from '@/server/learn/types'
import { LectureAttendanceDetailBadge } from '@/components/features/learn/attendance/LectureAttendanceDetailBadge'
import { LectureOptionalAttendanceInfo } from '@/components/features/learn/attendance/LectureOptionalAttendanceInfo'
import { useListingAttendancePresentation } from '@/components/features/learn/attendance/useLectureAttendancePresentation'
import { formatLearnDetailPriorityLabel } from '@/server/learn/utils/formatLearnDetailDisplay'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LocalTimeWithIstTooltip } from '@/components/shared/local-time-with-ist-tooltip'
import { MasaiChips } from '@/components/ui/masai-chips'
import { cn } from '@/lib/utils'

type LectureDetailOverviewHeaderProps = {
  title: string
  tags: Array<string>
  priority: LearningPriority
  hostName: string
  avatarUrl: string | null
  dateRange: string
  /** Same range in IST; shown on hover when the viewer isn't in IST. */
  dateRangeIst?: string
  attendance: LectureAttendanceSummary | null
  /** Set only for optional (recommended) lectures; renders the info tooltip. */
  optionalAttendance?: LectureAttendanceSummary | null
  watchPercentage?: number | null
  /** Header CTAs (Raise Ticket + bookmark) rendered top-right. */
  actions?: ReactNode
  className?: string
}

function hostInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const first = parts[0]
  const last = parts[parts.length - 1]
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export function LectureDetailOverviewHeader({
  title,
  tags,
  priority,
  hostName,
  avatarUrl,
  dateRange,
  dateRangeIst,
  attendance,
  optionalAttendance,
  watchPercentage,
  actions,
  className,
}: LectureDetailOverviewHeaderProps) {
  const attendancePresentation = useListingAttendancePresentation(
    attendance,
    watchPercentage,
  )
  const showAttendance = attendance != null && attendancePresentation.uiState != null

  return (
    <section
      className={cn(
        'flex flex-col gap-4 border-b border-border bg-background py-3 md:flex-row md:items-start md:justify-between md:gap-6 md:py-4',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="type-h5 line-clamp-3 min-w-0 text-gray-900 md:line-clamp-2">
          {title}
        </h1>
        {/* Tag chips, then the status components (info button + Present badge)
            grouped to their right with a 16px (gap-4) gap between the two. */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag, index) => (
              <MasaiChips
                key={`${tag}-${index}`}
                type="default"
                size="regular"
                label={tag}
                tabIndex={-1}
                className="cursor-default"
                {...lectureDetailTagChipPalette}
              />
            ))}
            <MasaiChips
              type="default"
              size="regular"
              label={formatLearnDetailPriorityLabel(priority)}
              tabIndex={-1}
              className="cursor-default"
              {...lectureDetailTagChipPalette}
            />
          </div>
          {optionalAttendance || (showAttendance && attendance) ? (
            <div className="flex shrink-0 items-center gap-2">
              {optionalAttendance ? (
                <LectureOptionalAttendanceInfo
                  attendance={optionalAttendance}
                  size="md"
                />
              ) : null}
              {showAttendance && attendance ? (
                <LectureAttendanceDetailBadge
                  {...attendancePresentation}
                  attendance={attendance}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 md:max-w-[min(100%,280px)] md:items-end">
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
        <div className="flex items-start gap-3 md:justify-end">
          <Avatar size="lg" className="size-10 shrink-0">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={hostName} /> : null}
            <AvatarFallback className="type-b2-md bg-muted text-gray-700">
              {hostInitials(hostName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 pt-0.5 text-left">
            <p className="type-b1-md text-gray-900">{hostName}</p>
            {dateRange ? (
              <LocalTimeWithIstTooltip
                local={dateRange}
                ist={dateRangeIst}
                className="type-b2-regular mt-0.5 block text-gray-600"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
