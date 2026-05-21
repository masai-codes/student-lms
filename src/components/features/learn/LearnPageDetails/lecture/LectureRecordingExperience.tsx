'use client'

import { useCallback, useEffect, useState } from 'react'

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
  LECTURE_SPLIT_VIDEO_WIDTH_PERCENT,
} from './constants/lectureTheaterMode'
import { useLectureHeroViewportHeight } from './hooks/useLectureHeroViewportHeight'
import { useLectureTheaterMode } from './hooks/useLectureTheaterMode'
import { LectureDetailFooter } from './shared/LectureDetailFooter'
import { LectureDetailChrome } from './shared/LectureDetailChrome'
import { LectureVideoSection } from './video'
import type { DiscussionListItem, LearningPriority } from '@/server/learn/types'
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
}

const chatLoaderProps = {
  openingLoaderSweepMs: LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
  openingLoaderSizePx: LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  showOpeningLoader: LECTURE_CHAT_OPENING_LOADER_ENABLED,
  openingLoaderGif: LECTURE_CHAT_OPENING_LOADER_GIF,
} as const

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
}: LectureRecordingExperienceProps) {
  const { rootRef, heightPx } = useLectureHeroViewportHeight()
  const { isTheaterMode, toggleTheaterMode } = useLectureTheaterMode()
  const isSplitLayout = !isTheaterMode
  const [isChatDocked, setIsChatDocked] = useState(false)
  const chat = useLectureAiChat({
    defaultExpanded: isSplitLayout && LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT,
  })

  useEffect(() => {
    if (isSplitLayout) {
      chat.open()
      return
    }
    chat.close()
  }, [isSplitLayout, chat.open, chat.close])

  const onTheaterModeToggle = useCallback(() => {
    if (isTheaterMode) {
      chat.open()
    } else {
      chat.close()
    }
    toggleTheaterMode()
  }, [isTheaterMode, toggleTheaterMode, chat.open, chat.close])

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

  const hero = (
    <div
      ref={rootRef}
      className={cn(
        'flex w-full shrink-0 flex-col overflow-visible bg-white',
        isTheaterMode &&
          isChatDocked &&
          (chat.isExpanded
            ? 'pb-[calc(7rem+18rem+env(safe-area-inset-bottom))] max-md:pb-[calc(11.5rem+18rem+env(safe-area-inset-bottom))]'
            : 'pb-28 max-md:pb-[calc(7rem+env(safe-area-inset-bottom))]'),
      )}
      style={
        heightPx != null
          ? { height: heightPx, minHeight: heightPx, maxHeight: heightPx }
          : undefined
      }
    >
      {isTheaterMode ? (
        <LectureVideoSection
          videoUrl={videoUrl}
          className="min-h-0 flex-1"
          isTheaterMode={isTheaterMode}
          onTheaterModeToggle={onTheaterModeToggle}
        />
      ) : (
        <div
          className="flex min-h-0 w-full flex-1 flex-row items-stretch overflow-hidden bg-black"
          data-lecture-split-layout
        >
          <div
            className="flex min-h-0 shrink-0 flex-col border-r border-black bg-black"
            style={{ width: `${LECTURE_SPLIT_VIDEO_WIDTH_PERCENT}%` }}
          >
            <LectureVideoSection
              videoUrl={videoUrl}
              className="min-h-0 flex-1"
              fullBleed={false}
              isTheaterMode={isTheaterMode}
              onTheaterModeToggle={onTheaterModeToggle}
            />
          </div>
          <div
            className="flex h-full min-h-0 shrink-0 flex-col"
            style={{ width: `${LECTURE_SPLIT_CHAT_WIDTH_PERCENT}%` }}
          >
            <LectureAiChatTheaterSidebar {...chatProps} />
          </div>
        </div>
      )}
    </div>
  )

  const belowHero = isTheaterMode ? (
    <LectureAiChatDock {...chatProps} onDockedChange={setIsChatDocked} />
  ) : null

  return (
    <LectureDetailChrome
      title={title}
      tags={tags}
      priority={priority}
      hostName={hostName}
      hostAvatarUrl={hostAvatarUrl}
      scheduleDisplayRange={scheduleDisplayRange}
      hero={hero}
      belowHero={belowHero}
      footer={
        <LectureDetailFooter entityId={entityId} discussions={discussions} />
      }
    />
  )
}
