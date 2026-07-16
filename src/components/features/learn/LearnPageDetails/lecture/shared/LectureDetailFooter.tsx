'use client'

import { useEffect, useState } from 'react'

import { LectureDiscussionsSection } from '../discussions'
import { LectureFeedbackForm } from '../feedback/LectureFeedbackForm'
import {
  LectureTabBar,
  LectureTabContentSection,
  resolveDefaultLectureTabId,
} from '../tabs'
import type { LectureDetailTabId } from '../tabs'

import type { DiscussionListItem } from '@/server/learn/types'
import type {
  LectureDetailTabContent,
  LectureFeedbackState,
} from '@/server/learn/lectureDetailTypes'

type LectureDetailFooterProps = {
  entityId: number
  discussions: Array<DiscussionListItem>
  hideNotes: boolean
  tabs: LectureDetailTabContent
  feedback: LectureFeedbackState
}

export function LectureDetailFooter({
  entityId,
  discussions,
  hideNotes,
  tabs,
  feedback,
}: LectureDetailFooterProps) {
  const [activeTabId, setActiveTabId] = useState<LectureDetailTabId>(() =>
    resolveDefaultLectureTabId(hideNotes),
  )

  useEffect(() => {
    // The Description tab is hidden when notes are hidden; fall back to the first
    // visible tab so we never land on a tab that isn't rendered.
    if (hideNotes && activeTabId === 'description') {
      setActiveTabId(resolveDefaultLectureTabId(true))
    }
  }, [activeTabId, hideNotes])

  return (
    <>
      <div className="shrink-0 pb-4">
        <LectureFeedbackForm lectureId={entityId} feedback={feedback} />
      </div>
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
