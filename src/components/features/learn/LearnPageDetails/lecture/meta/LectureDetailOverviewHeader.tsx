'use client'

import { lectureDetailTagChipPalette } from './lectureDetailTagChips'

import { LectureAttendanceInline } from '@/components/features/learn/attendance/LectureAttendanceInline'
import { useListingAttendancePresentation } from '@/components/features/learn/attendance/useLectureAttendancePresentation'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type { LearningPriority } from '@/server/learn/types'
import { formatLearnDetailPriorityLabel } from '@/server/learn/utils/formatLearnDetailDisplay'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MasaiChips } from '@/components/ui/masai-chips'
import { cn } from '@/lib/utils'

type LectureDetailOverviewHeaderProps = {
  title: string
  tags: Array<string>
  priority: LearningPriority
  hostName: string
  avatarUrl: string | null
  dateRange: string
  attendance: LectureAttendanceSummary | null
  watchPercentage?: number | null
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
  attendance,
  watchPercentage,
  className,
}: LectureDetailOverviewHeaderProps) {
  const attendancePresentation = useListingAttendancePresentation(
    attendance,
    watchPercentage,
  )

  return (
    <section
      className={cn(
        'flex flex-col gap-4 border-b border-border bg-background py-3 md:flex-row md:items-start md:justify-between md:gap-6 md:py-4',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="type-h5 line-clamp-3 text-gray-900 md:line-clamp-2">{title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
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
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 md:max-w-[min(100%,280px)]">
        {attendance != null ? (
          <LectureAttendanceInline {...attendancePresentation} />
        ) : null}
        <div className="flex items-start gap-3">
        <Avatar size="lg" className="size-10 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={hostName} /> : null}
          <AvatarFallback className="type-b2-md bg-muted text-gray-700">
            {hostInitials(hostName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 pt-0.5 text-left">
          <p className="type-b1-md text-gray-900">{hostName}</p>
          {dateRange ? (
            <p className="type-b2-regular mt-0.5 text-gray-600">{dateRange}</p>
          ) : null}
        </div>
        </div>
      </div>
    </section>
  )
}
