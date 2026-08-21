'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchInLecturePopupElementsFromApi } from '@/lib/api/learn/learnApi'
import { LectureDiscussionsSection } from '../discussions'
import { LectureFeedbackForm } from '../feedback/LectureFeedbackForm'
import {
  LectureTabBar,
  LectureTabContentSection,
  resolveDefaultLectureTabId,
  resolveVisibleLectureDetailTabs,
} from '../tabs'
import type { LectureDetailTabId } from '../tabs'

import type { DiscussionListItem } from '@/server/learn/types'
import type {
  InLecturePopupElements,
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
  inLecturePopupElements?: InLecturePopupElements
  /**
   * Bumped from deep inside the video player right after an in-lecture quiz
   * or poll is submitted — triggers a refetch of `inLecturePopupElements` so
   * the Attempted Assessments tab picks up the new `submittedAt` without a
   * full page reload. 0 is the "never fired" sentinel; any change above that
   * fires once.
   */
  assessmentSubmittedNonce?: number
}

export function LectureDetailFooter({
  entityId,
  discussions,
  hideNotes,
  tabs,
  feedback,
  inLecturePopupElements,
  assessmentSubmittedNonce = 0,
}: LectureDetailFooterProps) {
  // Overrides `inLecturePopupElements` once a quiz/poll submission triggers a
  // refetch (see the effect below) — null until then, so this component
  // otherwise renders straight off the page-load prop.
  const [refetchedPopupElements, setRefetchedPopupElements] =
    useState<InLecturePopupElements | null>(null)
  const effectivePopupElements =
    refetchedPopupElements ?? inLecturePopupElements

  useEffect(() => {
    // 0 is the "never fired" sentinel, so this never fires just because the
    // footer mounted.
    if (assessmentSubmittedNonce === 0) return
    let cancelled = false
    fetchInLecturePopupElementsFromApi(entityId)
      .then((result) => {
        if (!cancelled) setRefetchedPopupElements(result)
      })
      .catch((err) => {
        console.error(
          '[lecture-detail-footer] refetch popup elements FAILED',
          err,
        )
      })
    return () => {
      cancelled = true
    }
  }, [assessmentSubmittedNonce, entityId])

  const hasAttemptedAssessments =
    (effectivePopupElements?.quiz.some((quiz) => quiz.submittedAt != null) ??
      false) ||
    (effectivePopupElements?.polls.some((poll) => poll.submittedAt != null) ??
      false)
  const [activeTabId, setActiveTabId] = useState<LectureDetailTabId>(() =>
    resolveDefaultLectureTabId(hideNotes, hasAttemptedAssessments),
  )
  const tabBarRef = useRef<HTMLDivElement>(null)

  // Bring the tab bar to the top so its content is immediately visible.
  // Scrolls whichever element actually scrolls: the split layout's left
  // column on laptop/desktop, or the window on mobile/tablet (where a sticky
  // header, if any, needs an offset).
  const scrollTabBarIntoView = useCallback(() => {
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

  const handleTabChange = useCallback(
    (tabId: LectureDetailTabId) => {
      setActiveTabId(tabId)
      scrollTabBarIntoView()
    },
    [scrollTabBarIntoView],
  )

  useEffect(() => {
    // The Description tab is hidden when notes are hidden, and Attempted
    // Assessments only shows once something's been submitted; fall back to
    // the first visible tab so we never land on a tab that isn't rendered.
    const stillVisible = resolveVisibleLectureDetailTabs(
      hideNotes,
      hasAttemptedAssessments,
    ).some((tab) => tab.id === activeTabId)
    if (!stillVisible) {
      setActiveTabId(
        resolveDefaultLectureTabId(hideNotes, hasAttemptedAssessments),
      )
    }
  }, [activeTabId, hideNotes, hasAttemptedAssessments])

  return (
    <>
      <div className="shrink-0 pb-4">
        <LectureFeedbackForm lectureId={entityId} feedback={feedback} />
      </div>
      <div
        ref={tabBarRef}
        data-lecture-viewport-chrome
        className="relative shrink-0"
      >
        <LectureTabBar
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
          hideNotes={hideNotes}
          hasAttemptedAssessments={hasAttemptedAssessments}
          className="pb-3 pt-3"
        />
      </div>
      <LectureTabContentSection
        tabId={activeTabId}
        tabs={tabs}
        inLecturePopupElements={effectivePopupElements}
        lectureId={entityId}
        className="px-0 py-5"
      />
      <LectureDiscussionsSection
        entityId={entityId}
        entityKind="lecture"
        discussions={discussions}
        emptyStateContext="lecture"
        layout="footer"
        className="px-0 pb-10 pt-8"
      />
    </>
  )
}
