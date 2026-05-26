'use client'

import { useEffect, useState } from 'react'

import { LectureDiscussionsSection } from '../discussions'
import {
  DEFAULT_LECTURE_TAB_ID,
  LectureTabBar,
  LectureTabContentSection,
} from '../tabs'
import type { LectureDetailTabId } from '../tabs'

import type { DiscussionListItem } from '@/server/learn/types'
import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'

type LectureDetailFooterProps = {
  entityId: number
  discussions: Array<DiscussionListItem>
  hideNotes: boolean
  tabs: LectureDetailTabContent
}

export function LectureDetailFooter({
  entityId,
  discussions,
  hideNotes,
  tabs,
}: LectureDetailFooterProps) {
  const [activeTabId, setActiveTabId] =
    useState<LectureDetailTabId>(DEFAULT_LECTURE_TAB_ID)

  useEffect(() => {
    if (hideNotes && activeTabId === 'notes') {
      setActiveTabId(DEFAULT_LECTURE_TAB_ID)
    }
  }, [activeTabId, hideNotes])

  return (
    <>
      <div data-lecture-viewport-chrome className="shrink-0">
        <LectureTabBar
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          hideNotes={hideNotes}
          className="border-b border-border pb-3 pt-3"
        />
      </div>
      <LectureTabContentSection
        tabId={activeTabId}
        tabs={tabs}
        className="px-0 py-5"
      />
      <LectureDiscussionsSection
        entityId={entityId}
        entityKind="lecture"
        discussions={discussions}
        emptyStateContext="lecture"
        layout="footer"
        className="border-t border-border px-0"
      />
    </>
  )
}
