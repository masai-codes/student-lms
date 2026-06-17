'use client'

import { LectureDesktopChatSidebar } from './components/LectureDesktopChatSidebar'
import { useLectureHeroViewportHeight } from './hooks/useLectureHeroViewportHeight'
import { LectureDetailFooter } from './shared/LectureDetailFooter'
import { LectureDetailChrome } from './shared/LectureDetailChrome'
import { LectureVideoSection } from './video'
import type { DiscussionListItem, LearningPriority } from '@/server/learn/types'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import type {
  LectureDetailTabContent,
  LectureVideoAttendanceState,
} from '@/server/learn/lectureDetailTypes'
import { ChatbotExperience } from '@/components/features/chatbot/ChatbotExperience'
import { cn } from '@/lib/utils'

type LectureRecordingExperienceProps = {
  videoUrl: string
  title: string
  tags: Array<string>
  priority: LearningPriority
  hostName: string
  hostAvatarUrl: string | null
  scheduleDisplayRange: string
  entityId: number
  discussions: Array<DiscussionListItem>
  hideNotes: boolean
  tabs: LectureDetailTabContent
  videoAttendance: LectureVideoAttendanceState | null
  attendance: LectureAttendanceSummary | null
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
  entityId,
  discussions,
  hideNotes,
  tabs,
  videoAttendance,
  attendance,
}: LectureRecordingExperienceProps) {
  const { rootRef, heightPx } = useLectureHeroViewportHeight()

  const renderVideoSection = () => (
    <LectureVideoSection
      lectureId={entityId}
      videoUrl={videoUrl}
      initialAttendance={videoAttendance}
      className="min-h-0 flex-1"
      fullBleed={false}
    />
  )

  const hero = (
    <div
      ref={rootRef}
      className="flex w-full shrink-0 flex-col overflow-visible bg-white"
      style={
        heightPx != null
          ? { height: heightPx, minHeight: heightPx, maxHeight: heightPx }
          : undefined
      }
    >
      <div
        className={cn(
          heroRowFullBleedClasses,
          'hidden min-h-0 flex-1 flex-row items-stretch overflow-hidden bg-black md:flex',
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
          'flex min-h-0 flex-1 flex-col bg-black md:hidden',
        )}
      >
        {renderVideoSection()}
      </div>
    </div>
  )

  const belowHero = (
    <div className="shrink-0 border-t border-gray-200 bg-white md:hidden">
      <ChatbotExperience lectureId={entityId} />
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
      attendance={attendance}
      watchPercentage={videoAttendance?.watchPercentage}
      hero={hero}
      belowHero={belowHero}
      footer={
        <LectureDetailFooter
          entityId={entityId}
          discussions={discussions}
          hideNotes={hideNotes}
          tabs={tabs}
        />
      }
    />
  )
}
