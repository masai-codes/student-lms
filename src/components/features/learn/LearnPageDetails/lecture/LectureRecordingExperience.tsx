'use client'

import { useState } from 'react'

import { LectureDesktopChatSidebar } from './components/LectureDesktopChatSidebar'
import { useLectureHeroViewportHeight } from './hooks/useLectureHeroViewportHeight'
import { LectureDetailActions } from './shared/LectureDetailActions'
import { LectureDetailFooter } from './shared/LectureDetailFooter'
import { LectureDetailChrome } from './shared/LectureDetailChrome'
import { LectureVideoSection } from './video'
import type { DiscussionListItem, LearningPriority } from '@/server/learn/types'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type {
  InLecturePopupElements,
  LectureDetailTabContent,
  LectureFeedbackState,
  LectureVideoAttendanceState,
} from '@/server/learn/lectureDetailTypes'
import { LectureAiChatExperience } from '@/components/features/lecture-ai-chat/LectureAiChatExperience'
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
  inLecturePopupElements: InLecturePopupElements
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
  inLecturePopupElements,
}: LectureRecordingExperienceProps) {
  // On mobile the hero (video) height tracks the actual video aspect ratio.
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)
  const { rootRef, heightPx } = useLectureHeroViewportHeight(videoAspectRatio)

  const renderVideoSection = () => (
    <LectureVideoSection
      lectureId={entityId}
      videoUrl={videoUrl}
      initialAttendance={videoAttendance}
      transcriptSegments={tabs.transcriptSegments}
      inLecturePopupElements={inLecturePopupElements}
      className="min-h-0 flex-1"
      fullBleed={false}
      onVideoAspectRatioChange={setVideoAspectRatio}
    />
  )

  const hero = (
    <div
      ref={rootRef}
      className="flex w-full shrink-0 flex-col overflow-visible bg-surface"
      style={
        heightPx != null
          ? { height: heightPx, minHeight: heightPx, maxHeight: heightPx }
          : undefined
      }
    >
      {/* `has-[:fullscreen]:flex` on both rows: entering fullscreen on Android
          locks the screen to landscape, which flips the viewport past the `md`
          breakpoint — without it the fullscreened row goes display:none and the
          browser instantly exits fullscreen. */}
      <div
        className={cn(
          heroRowFullBleedClasses,
          'hidden min-h-0 flex-1 flex-row items-stretch overflow-hidden bg-black md:flex has-[:fullscreen]:flex',
        )}
        data-lecture-split-layout
      >
        <LectureDesktopChatSidebar
          lectureId={entityId}
          video={renderVideoSection()}
        />
      </div>

      <div
        className={cn(
          heroRowFullBleedClasses,
          'flex min-h-0 flex-1 flex-col bg-black md:hidden has-[:fullscreen]:flex',
        )}
      >
        {renderVideoSection()}
      </div>
    </div>
  )

  const belowHero = (
    <div className="shrink-0 border-t border-border bg-surface md:hidden">
      <LectureAiChatExperience lectureId={entityId} variant="mobile-dock" />
    </div>
  )

  return (
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
  )
}
