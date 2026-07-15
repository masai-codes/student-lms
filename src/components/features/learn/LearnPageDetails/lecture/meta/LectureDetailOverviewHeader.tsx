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
  /** `live`/`scrum` lecture — shows the Live line in the attendance breakdown. */
  isLiveLecture: boolean
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
  isLiveLecture,
  watchPercentage,
  actions,
  className,
}: LectureDetailOverviewHeaderProps) {
  const attendancePresentation = useListingAttendancePresentation(
    attendance,
    watchPercentage,
  )
  const showAttendance =
    attendance != null && attendancePresentation.uiState != null

  return (
    <section
      className={cn(
        'flex flex-col gap-3 border-b border-border bg-background py-3 dark:bg-transparent md:flex-row md:items-start md:justify-between md:gap-6 md:py-5',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="type-h5 line-clamp-2 min-w-0 text-foreground">
          {title}
        </h1>
        {/* Tag chips, then the status components (info button + Present badge)
            grouped to their right with a 16px (gap-4) gap between the two. */}
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {tags.map((tag, index) => (
              <MasaiChips
                key={`${tag}-${index}`}
                type="default"
                size="regular"
                label={tag}
                tabIndex={-1}
                className="max-w-full cursor-default truncate transition-colors duration-200 hover:border-brand/35"
                {...lectureDetailTagChipPalette}
              />
            ))}
            <MasaiChips
              type="default"
              size="regular"
              label={formatLearnDetailPriorityLabel(priority)}
              tabIndex={-1}
              className="max-w-full cursor-default truncate transition-colors duration-200 hover:border-brand/35"
              {...lectureDetailTagChipPalette}
            />
          </div>
          {optionalAttendance || (showAttendance && attendance) ? (
            <div className="flex shrink-0 items-center gap-2">
              {optionalAttendance ? (
                <LectureOptionalAttendanceInfo
                  attendance={optionalAttendance}
                  isLiveLecture={isLiveLecture}
                  size="md"
                />
              ) : null}
              {showAttendance && attendance ? (
                <LectureAttendanceDetailBadge
                  {...attendancePresentation}
                  attendance={attendance}
                  isLiveLecture={isLiveLecture}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile: host (left) and CTAs (right) share one row to save vertical
          space, but the row is allowed to WRAP — on narrow widths the CTAs
          drop to their own line instead of crushing the host name into
          mid-word breaks. Desktop keeps its column with the CTAs above the
          host, right aligned (flex-col-reverse over the same DOM order). */}
      <div className="flex min-w-0 shrink-0 flex-row flex-wrap items-center justify-between gap-3 md:max-w-[min(100%,280px)] md:flex-col-reverse md:flex-nowrap md:items-end md:justify-start md:gap-3">
        <div className="flex min-w-[180px] flex-1 items-start gap-3 md:min-w-0 md:flex-none md:justify-end">
          <Avatar
            size="lg"
            className="size-10 shrink-0 ring-2 ring-brand/15 ring-offset-2 ring-offset-background transition-transform duration-300 hover:scale-105"
          >
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={hostName} /> : null}
            <AvatarFallback className="type-b2-md bg-muted text-foreground">
              {hostInitials(hostName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 pt-0.5 text-left">
            <p className="type-b1-md break-words text-foreground">{hostName}</p>
            {dateRange ? (
              <LocalTimeWithIstTooltip
                local={dateRange}
                ist={dateRangeIst}
                className="type-b2-regular mt-0.5 block text-foreground-muted"
              />
            ) : null}
          </div>
        </div>
        {actions ? (
          // Press physics for the header CTAs (Raise Ticket + bookmark).
          <div className="flex shrink-0 items-center gap-2 [&_a]:transition-transform [&_a]:duration-150 [&_a]:active:scale-95 [&_button]:transition-transform [&_button]:duration-150 [&_button]:active:scale-95">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  )
}
