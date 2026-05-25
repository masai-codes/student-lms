'use client'

import { useEffect } from 'react'

import {
  LectureAiChatDock,
  LectureAiChatTheaterSidebar,
  useLectureAiChat,
} from './ai-chat'
import {
  LECTURE_CHAT_OPENING_LOADER_ENABLED,
  LECTURE_CHAT_OPENING_LOADER_GIF,
  LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
} from './ai-chat/constants/lectureAiChatUi'
import {
  LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT,
  LECTURE_SPLIT_CHAT_WIDTH_PERCENT,
} from './constants/lectureSplitLayout'
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

const chatLoaderProps = {
  openingLoaderSweepMs: LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
  openingLoaderSizePx: LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  showOpeningLoader: LECTURE_CHAT_OPENING_LOADER_ENABLED,
  openingLoaderGif: LECTURE_CHAT_OPENING_LOADER_GIF,
} as const

/** Edge-to-edge row: breaks out of any centered page column. */
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
  const chat = useLectureAiChat({
    defaultExpanded: LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT,
  })

  useEffect(() => {
    chat.open()
  }, [chat.open])

  const chatProps = {
    ...chatLoaderProps,
    isExpanded: chat.isExpanded,
    isSending: chat.isSending,
    messages: chat.messages,
    inputValue: chat.inputValue,
    onInputChange: chat.setInputValue,
    onOpen: chat.open,
    onClose: chat.close,
    onSend: chat.sendMessage,
  }

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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-black">
          {renderVideoSection()}
        </div>
        <div
          className="flex h-full min-h-0 shrink-0 flex-col bg-[#1c1c1c]"
          style={{ width: `${LECTURE_SPLIT_CHAT_WIDTH_PERCENT}%` }}
        >
          <LectureAiChatTheaterSidebar {...chatProps} />
        </div>
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
    <div className="md:hidden">
      <LectureAiChatDock {...chatProps} />
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
