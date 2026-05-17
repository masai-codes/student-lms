'use client'

import { STATIC_LECTURE_DETAIL } from './constants/staticLectureDetail'
import { LectureDiscussionsSection } from './discussions'
import { useLectureHeroViewportHeight } from './hooks/useLectureHeroViewportHeight'
import { formatLectureDateRange, LectureHostRow, LectureTitleStrip } from './meta'
import { LectureDetailTabsSection } from './tabs'
import { LectureVideoSection } from './video'

import type { LearnHubDetailPayload } from '@/server/learn/types'
import { lectureDetailContentClasses } from '@/lib/layout'

type LectureDetailPageProps = {
  detail: LearnHubDetailPayload
}

export function LectureDetailPage({ detail: _detail }: LectureDetailPageProps) {
  const lecture = STATIC_LECTURE_DETAIL
  const dateRange = formatLectureDateRange(
    lecture.scheduleStart,
    lecture.scheduleEnd,
  )
  const { rootRef, heightPx } = useLectureHeroViewportHeight()

  return (
    <div className="w-full pb-12">
      <section
        ref={rootRef}
        className="flex w-full shrink-0 flex-col"
        style={
          heightPx != null
            ? { height: heightPx, minHeight: heightPx, maxHeight: heightPx }
            : undefined
        }
      >
        <LectureVideoSection
          videoUrl={lecture.videoUrl}
          className="min-h-0 flex-1"
        />
        <div className={lectureDetailContentClasses}>
          <LectureTitleStrip title={lecture.title} />
          <LectureHostRow
            hostName={lecture.host.name}
            avatarUrl={lecture.host.avatarUrl}
            dateRange={dateRange}
          />
        </div>
      </section>

      <div className={lectureDetailContentClasses}>
        <LectureDetailTabsSection />
        <LectureDiscussionsSection />
      </div>
    </div>
  )
}
