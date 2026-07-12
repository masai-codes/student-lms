import { Info } from '@phosphor-icons/react'

import type { LectureAttendanceBannerDescriptor } from '@/lib/lecture-attendance/resolveLectureAttendanceBanner'

type LectureAttendanceBannerProps = {
  banner: LectureAttendanceBannerDescriptor
}

/**
 * Blue info disclaimer shown on the lecture detail page. Which variant renders
 * (or whether it renders at all) is decided by `resolveLectureAttendanceBanner`;
 * this component only paints the given descriptor.
 */
export function LectureAttendanceBanner({ banner }: LectureAttendanceBannerProps) {
  return (
    <div
      data-testid={banner.testId}
      className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-blue-700"
    >
      <Info weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="min-w-0 break-words text-sm">{banner.text}</p>
    </div>
  )
}
