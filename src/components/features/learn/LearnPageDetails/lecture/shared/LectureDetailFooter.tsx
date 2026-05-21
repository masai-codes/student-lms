'use client'

import { useState } from 'react'

import { LectureDiscussionsSection } from '../discussions'
import {
  DEFAULT_LECTURE_TAB_ID,
  LectureTabBar,
  LectureTabContentSection,
} from '../tabs'
import type { LectureDetailTabId } from '../tabs'

import type { DiscussionListItem } from '@/server/learn/types'

type LectureDetailFooterProps = {
  entityId: number
  discussions: Array<DiscussionListItem>
}

export function LectureDetailFooter({
  entityId,
  discussions,
}: LectureDetailFooterProps) {
  const [activeTabId, setActiveTabId] =
    useState<LectureDetailTabId>(DEFAULT_LECTURE_TAB_ID)

  return (
    <>
      <LectureTabBar
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        className="shrink-0 border-b border-border pb-3 pt-3"
      />
      <LectureTabContentSection tabId={activeTabId} className="px-0 py-5" />
      <LectureDiscussionsSection
        entityId={entityId}
        discussions={discussions}
        className="border-t border-border px-0"
      />
    </>
  )
}
