'use client'

import { LectureTabPanel } from './LectureTabPanel'
import type { LectureDetailTabId } from './constants/staticLectureTabContent'

import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'
import { cn } from '@/lib/utils'

type LectureTabContentSectionProps = {
  tabId: LectureDetailTabId
  tabs: LectureDetailTabContent
  className?: string
}

/** Tab panel body (scrolls below the viewport-locked hero + tab row). */
export function LectureTabContentSection({
  tabId,
  tabs,
  className,
}: LectureTabContentSectionProps) {
  return (
    <section
      className={cn('border-b border-border bg-surface py-5', className)}
    >
      <LectureTabPanel key={tabId} tabId={tabId} tabs={tabs} />
    </section>
  )
}
