'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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
  const tabBarRef = useRef<HTMLDivElement>(null)

  const handleTabChange = useCallback((tabId: LectureDetailTabId) => {
    setActiveTabId(tabId)
    // Bring the tab bar to the top of the viewport so the selected tab's
    // content is immediately visible after switching tabs. Offset by the
    // sticky navbar height so the tab row isn't hidden behind it.
    const tabBar = tabBarRef.current
    if (!tabBar) return
    const navbar = document.querySelector<HTMLElement>('[data-app-navbar]')
    const navbarHeight = navbar?.offsetHeight ?? 0
    const top =
      tabBar.getBoundingClientRect().top + window.scrollY - navbarHeight - 12
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

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
      <div
        ref={tabBarRef}
        data-lecture-viewport-chrome
        className="shrink-0"
      >
        <LectureTabBar
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
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
