import { formatCatchUpRemainingLabel } from '@/lib/lecture-attendance/formatCatchUpRemainingLabel'
import type { LectureCatchUpProgress } from '@/lib/lecture-attendance/resolveLectureCatchUpProgress'

type LectureCatchupProgressBarProps = {
  progress: LectureCatchUpProgress
  /** Recording watch progress 0–100 (from `video_attendances.duration`). */
  watchPercentage: number
}

/**
 * Dark catch-up strip shown in place of the blue disclaimer banner while the
 * student is mid-catch-up (`continue_watching`) on a recording that counts
 * toward attendance. Ported from the legacy LMS `VideoCatchupProgressBar`
 * (Figma dark surface #18222D): "Watch the full video to mark your attendance",
 * a green watched-progress bar, and a days-remaining pill. Whether it renders is
 * decided by {@link resolveLectureCatchUpProgress}; this component only paints.
 */
export function LectureCatchupProgressBar({
  progress,
  watchPercentage,
}: LectureCatchupProgressBarProps) {
  const pct = Math.min(100, Math.max(0, watchPercentage))
  const daysLabel = formatCatchUpRemainingLabel(
    progress.remainingLabel,
    progress.daysRemaining,
  )

  return (
    <div
      data-testid="lecture-attendance-catchup-progress"
      className="mt-4 flex w-full min-h-[56px] items-center justify-between gap-8 rounded-lg bg-[#18222D] px-4 py-2.5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-xs font-normal leading-4 text-[#E4E4EB]">
          Watch the full video to mark your attendance
        </p>
        <div className="flex flex-row flex-wrap items-center gap-3">
          <span className="shrink-0 text-xs font-normal leading-4 text-[#E4E4EB]">
            Progress
          </span>
          <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[#374151]">
            <div
              className="h-full rounded-full bg-[#22C55E] transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      {daysLabel ? (
        <div className="shrink-0 self-center rounded-full bg-[#131c24] px-2.5 py-1 text-center text-xs font-medium leading-4 text-[#FCE96A]">
          {daysLabel}
        </div>
      ) : null}
    </div>
  )
}
