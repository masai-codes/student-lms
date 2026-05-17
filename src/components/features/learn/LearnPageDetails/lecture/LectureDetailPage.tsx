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
import { STATIC_LECTURE_DETAIL } from './constants/staticLectureDetail'
import {
  LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT,
  LECTURE_SPLIT_CHAT_WIDTH_PERCENT,
  LECTURE_SPLIT_VIDEO_WIDTH_PERCENT,
} from './constants/lectureTheaterMode'
import { LectureDiscussionsSection } from './discussions'
import { useLectureHeroViewportHeight } from './hooks/useLectureHeroViewportHeight'
import { useLectureTheaterMode } from './hooks/useLectureTheaterMode'
import { LectureHostRow, LectureTitleStrip, formatLectureDateRange } from './meta'
import {
  DEFAULT_LECTURE_TAB_ID,
  LectureTabBar,
  LectureTabContentSection,
} from './tabs'
import type { LectureDetailTabId } from './tabs'
import { LectureVideoSection } from './video'

import type { LearnHubDetailPayload } from '@/server/learn/types'
import { lectureDetailContentClasses } from '@/lib/layout'
import { cn } from '@/lib/utils'

type LectureDetailPageProps = {
  detail: LearnHubDetailPayload
}

const chatLoaderProps = {
  openingLoaderSweepMs: LECTURE_CHAT_OPENING_LOADER_SWEEP_MS,
  openingLoaderSizePx: LECTURE_CHAT_OPENING_LOADER_SIZE_PX,
  showOpeningLoader: LECTURE_CHAT_OPENING_LOADER_ENABLED,
  openingLoaderGif: LECTURE_CHAT_OPENING_LOADER_GIF,
} as const

export function LectureDetailPage({ detail: _detail }: LectureDetailPageProps) {
  const lecture = STATIC_LECTURE_DETAIL
  const dateRange = formatLectureDateRange(
    lecture.scheduleStart,
    lecture.scheduleEnd,
  )
  const { rootRef, heightPx } = useLectureHeroViewportHeight()
  const { isTheaterMode, toggleTheaterMode } = useLectureTheaterMode()
  const isSplitLayout = !isTheaterMode
  const [activeTabId, setActiveTabId] =
    useState<LectureDetailTabId>(DEFAULT_LECTURE_TAB_ID)
  const [isChatDocked, setIsChatDocked] = useState(false)
  const chat = useLectureAiChat({
    defaultExpanded:
      isSplitLayout && LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT,
  })

  useEffect(() => {
    if (isSplitLayout && LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT) {
      chat.open()
      return
    }
    if (isTheaterMode) {
      chat.close()
    }
  }, [isSplitLayout, isTheaterMode, chat.open, chat.close])

  const onTheaterModeToggle = useCallback(() => {
    if (isTheaterMode) {
      if (LECTURE_SPLIT_CHAT_OPEN_BY_DEFAULT) {
        chat.open()
      }
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

  return (
    <div
      className={cn(
        'w-full pb-12',
        isTheaterMode &&
          isChatDocked &&
          (chat.isExpanded
            ? 'pb-[calc(7rem+18rem+env(safe-area-inset-bottom))] max-md:pb-[calc(11.5rem+18rem+env(safe-area-inset-bottom))]'
            : 'pb-28 max-md:pb-[calc(7rem+env(safe-area-inset-bottom))]'),
      )}
    >
      <section
        ref={rootRef}
        className="flex w-full shrink-0 flex-col overflow-visible bg-white"
        style={
          heightPx != null
            ? { height: heightPx, minHeight: heightPx, maxHeight: heightPx }
            : undefined
        }
      >
        {isTheaterMode ? (
          <LectureVideoSection
            videoUrl={lecture.videoUrl}
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
                videoUrl={lecture.videoUrl}
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

        <div className={cn(lectureDetailContentClasses, 'relative z-20 shrink-0')}>
          <LectureTitleStrip title={lecture.title} />
          <LectureHostRow
            hostName={lecture.host.name}
            avatarUrl={lecture.host.avatarUrl}
            dateRange={dateRange}
            className="border-b-0"
          />
          {isTheaterMode ? (
            <LectureAiChatDock
              {...chatProps}
              onDockedChange={setIsChatDocked}
            />
          ) : null}
          <LectureTabBar
            activeTabId={activeTabId}
            onTabChange={setActiveTabId}
            className="shrink-0 border-b border-border pb-3 pt-3"
          />
        </div>
      </section>

      <div className={cn(lectureDetailContentClasses, 'bg-white')}>
        <LectureTabContentSection tabId={activeTabId} className="px-0 py-5" />
        <LectureDiscussionsSection />
      </div>
    </div>
  )
}
