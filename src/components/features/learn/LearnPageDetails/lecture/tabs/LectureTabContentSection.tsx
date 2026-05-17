'use client'

import { LectureTabPanel } from './LectureTabPanel'
import type { LectureDetailTabId } from './constants/staticLectureTabContent'

import { cn } from '@/lib/utils'

type LectureTabContentSectionProps = {
  tabId: LectureDetailTabId
  className?: string
}

/** Tab panel body (scrolls below the viewport-locked hero + tab row). */
export function LectureTabContentSection({
  tabId,
  className,
}: LectureTabContentSectionProps) {
  return (
    <section
      className={cn(
        'border-b border-border bg-white py-5',
        className,
      )}
    >
      <LectureTabPanel key={tabId} tabId={tabId} />
    </section>
  )
}
