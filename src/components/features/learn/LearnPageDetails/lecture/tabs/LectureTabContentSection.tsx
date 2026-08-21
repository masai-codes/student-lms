'use client'

import { LectureTabPanel } from './LectureTabPanel'
import type { LectureDetailTabId } from './constants/staticLectureTabContent'

import type {
  InLecturePopupElements,
  LectureDetailTabContent,
} from '@/server/learn/lectureDetailTypes'
import { cn } from '@/lib/utils'

type LectureTabContentSectionProps = {
  tabId: LectureDetailTabId
  tabs: LectureDetailTabContent
  inLecturePopupElements?: InLecturePopupElements
  /** Only needed for the 'attempted-assessments' tab; other tabs ignore it. */
  lectureId?: number
  className?: string
}

/** Tab panel body (scrolls below the viewport-locked hero + tab row). */
export function LectureTabContentSection({
  tabId,
  tabs,
  inLecturePopupElements,
  lectureId,
  className,
}: LectureTabContentSectionProps) {
  return (
    <section className={cn('py-5', className)}>
      <LectureTabPanel
        key={tabId}
        tabId={tabId}
        tabs={tabs}
        inLecturePopupElements={inLecturePopupElements}
        lectureId={lectureId}
      />
    </section>
  )
}
