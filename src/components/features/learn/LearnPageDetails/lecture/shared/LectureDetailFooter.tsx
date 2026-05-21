'use client'

import { useState } from 'react'

import {
  DEFAULT_LECTURE_TAB_ID,
  LectureTabBar,
  LectureTabContentSection,
} from '../tabs'
import type { LectureDetailTabId } from '../tabs'

import type { DiscussionListItem } from '@/server/learn/types'
import { EntityDiscussionsPanel } from '@/components/features/new-discussions'

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
      <section className="border-t border-border px-0 py-6">
        <EntityDiscussionsPanel
          entityKind="lecture"
          entityId={entityId}
          discussions={discussions}
          emptyStateContext="lecture"
        />
      </section>
    </>
  )
}
