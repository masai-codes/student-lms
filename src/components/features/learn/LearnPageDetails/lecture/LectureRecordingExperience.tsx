'use client'

import { useState } from 'react'

import { LectureAiChatMobileEntry } from './components/LectureAiChatMobileEntry'
import { LectureSplitLayout } from './components/LectureSplitLayout'
import { useLectureVideoMaxHeight } from './hooks/useLectureVideoMaxHeight'
import { LectureDetailActions } from './shared/LectureDetailActions'
import { LectureDetailFooter } from './shared/LectureDetailFooter'
import { LectureDetailChrome } from './shared/LectureDetailChrome'
import { LectureVideoSection } from './video'
import type { DiscussionListItem, LearningPriority } from '@/server/learn/types'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type {
  LectureDetailTabContent,
  LectureFeedbackState,
  LectureVideoAttendanceState,
} from '@/server/learn/lectureDetailTypes'
import { cn } from '@/lib/utils'

type LectureRecordingExperienceProps = {
  videoUrl: string
  title: string
  tags: Array<string>
  priority: LearningPriority
  hostName: string
  hostAvatarUrl: string | null
  scheduleDisplayRange: string
  scheduleDisplayRangeIst?: string
  entityId: number
  discussions: Array<DiscussionListItem>
  hideNotes: boolean
  tabs: LectureDetailTabContent
  videoAttendance: LectureVideoAttendanceState | null
  attendance: LectureAttendanceSummary | null
  /** Set only for optional (recommended) lectures; renders the info tooltip. */
  optionalAttendance?: LectureAttendanceSummary | null
  /** `live`/`scrum` lecture — shows the Live line in the attendance breakdown. */
  isLiveLecture: boolean
  isBookmarked: boolean
  feedback: LectureFeedbackState
}

const heroRowFullBleedClasses =
  'relative w-screen max-w-[100vw] shrink-0 left-1/2 -translate-x-1/2'

export function LectureRecordingExperience({
  videoUrl,
  title,
  tags,
  priority,
  hostName,
  hostAvatarUrl,
  scheduleDisplayRange,
  scheduleDisplayRangeIst,
  entityId,
  discussions,
  hideNotes,
  tabs,
  videoAttendance,
  attendance,
  optionalAttendance,
  isLiveLecture,
  isBookmarked,
  feedback,
}: LectureRecordingExperienceProps) {
  // The video simply takes the height it needs for its aspect ratio (real once
  // metadata loads, 16:9 until then); the rest of the page flows below and the
  // left column scrolls. No viewport-slice math crushing the video to keep the
  // tabs in view.
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)
  const aspectRatio =
    videoAspectRatio && videoAspectRatio > 0 ? videoAspectRatio : 16 / 9
  // Let the video grow to fill the viewport, but never so tall that the title
  // and tag rows get pushed off-screen.
  const { videoRef, maxHeightPx } = useLectureVideoMaxHeight()

  const renderVideoSection = () => (
    <LectureVideoSection
      lectureId={entityId}
      videoUrl={videoUrl}
      initialAttendance={videoAttendance}
      transcript={tabs.transcript}
      className="min-h-0 flex-1"
      fullBleed={false}
      onVideoAspectRatioChange={setVideoAspectRatio}
    />
  )

  const hero = (
    <div className="flex w-full shrink-0 flex-col overflow-visible bg-surface">
      {/* `has-[:fullscreen]:flex` on both rows: entering fullscreen on Android
          locks the screen to landscape, which flips the viewport past the `md`
          breakpoint — without it the fullscreened row goes display:none and the
          browser instantly exits fullscreen. */}
      {/* Desktop: the video fills the left section at its natural aspect ratio;
          the chat is a separate full-height right rail (LectureSplitLayout).
          Height capped so the title + tag rows stay visible below it. */}
      <div
        ref={videoRef}
        className="relative hidden w-full flex-col overflow-hidden bg-black md:flex has-[:fullscreen]:flex"
        style={{ aspectRatio, maxHeight: maxHeightPx }}
      >
        {renderVideoSection()}
      </div>

      <div
        className={cn(
          heroRowFullBleedClasses,
          'flex w-full flex-col bg-black md:hidden has-[:fullscreen]:flex',
        )}
        style={{ aspectRatio }}
      >
        {renderVideoSection()}
      </div>
    </div>
  )

  const belowHero = (
    <div className="shrink-0 border-t border-border bg-surface lg:hidden">
      <LectureAiChatMobileEntry lectureId={entityId} />
    </div>
  )

  return (
    <LectureSplitLayout lectureId={entityId}>
      <LectureDetailChrome
        title={title}
        tags={tags}
        priority={priority}
        hostName={hostName}
        hostAvatarUrl={hostAvatarUrl}
        scheduleDisplayRange={scheduleDisplayRange}
        scheduleDisplayRangeIst={scheduleDisplayRangeIst}
        attendance={attendance}
        optionalAttendance={optionalAttendance}
        isLiveLecture={isLiveLecture}
        watchPercentage={videoAttendance?.watchPercentage}
        showAttendanceBanner
        actions={
          <LectureDetailActions
            lectureId={entityId}
            initialIsBookmarked={isBookmarked}
          />
        }
        hero={hero}
        belowHero={belowHero}
        footer={
          <LectureDetailFooter
            entityId={entityId}
            discussions={discussions}
            hideNotes={hideNotes}
            tabs={tabs}
            feedback={feedback}
          />
        }
      />
    </LectureSplitLayout>
  )
}
