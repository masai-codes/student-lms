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

/**
 * Nearest scrollable ancestor of `el`. On laptop/desktop the lecture page
 * scrolls inside the split layout's left column (`overflow-y-auto`), not the
 * window — so tab switching must scroll that element. Returns `null` when the
 * window itself is the scroller (mobile/tablet natural scroll).
 */
function getScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node
    }
    node = node.parentElement
  }
  return null
}

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
    // Bring the tab bar to the top so the selected tab's content is immediately
    // visible after switching. Scroll whichever element actually scrolls: the
    // split layout's left column on laptop/desktop, or the window on
    // mobile/tablet (where a sticky header, if any, needs an offset).
    const tabBar = tabBarRef.current
    if (!tabBar) return

    const scrollParent = getScrollParent(tabBar)
    if (scrollParent) {
      const top =
        tabBar.getBoundingClientRect().top -
        scrollParent.getBoundingClientRect().top +
        scrollParent.scrollTop -
        12
      scrollParent.scrollTo({ top, behavior: 'smooth' })
      return
    }

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
      <div ref={tabBarRef} data-lecture-viewport-chrome className="shrink-0">
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
        className="border-t border-border px-0 pb-10 pt-8"
      />
    </>
  )
}
