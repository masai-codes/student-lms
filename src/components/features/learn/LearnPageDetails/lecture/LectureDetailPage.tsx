'use client'

import { useState } from 'react'

import { LectureAiChatDock } from './ai-chat'
import { STATIC_LECTURE_DETAIL } from './constants/staticLectureDetail'
import { LectureDiscussionsSection } from './discussions'
import { useLectureHeroViewportHeight } from './hooks/useLectureHeroViewportHeight'
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

export function LectureDetailPage({ detail: _detail }: LectureDetailPageProps) {
  const lecture = STATIC_LECTURE_DETAIL
  const dateRange = formatLectureDateRange(
    lecture.scheduleStart,
    lecture.scheduleEnd,
  )
  const { rootRef, heightPx } = useLectureHeroViewportHeight()
  const [activeTabId, setActiveTabId] =
    useState<LectureDetailTabId>(DEFAULT_LECTURE_TAB_ID)
  const [isChatDocked, setIsChatDocked] = useState(false)

  return (
    <div
      className={cn(
        'w-full pb-12',
        isChatDocked &&
          'pb-28 max-md:pb-[calc(7rem+env(safe-area-inset-bottom))]',
      )}
    >
      <section
        ref={rootRef}
        className="flex w-full shrink-0 flex-col bg-white"
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
        <div className={cn(lectureDetailContentClasses, 'shrink-0')}>
          <LectureTitleStrip title={lecture.title} />
          <LectureHostRow
            hostName={lecture.host.name}
            avatarUrl={lecture.host.avatarUrl}
            dateRange={dateRange}
            className="border-b-0"
          />
          <LectureAiChatDock onDockedChange={setIsChatDocked} />
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
