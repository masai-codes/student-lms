'use client'

import { useState } from 'react'

import { LectureTabBar } from './LectureTabBar'
import { LectureTabPanel } from './LectureTabPanel'
import { resolveDefaultLectureTabId } from './constants/staticLectureTabContent'
import type { LectureDetailTabId } from './constants/staticLectureTabContent'

import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'
import { cn } from '@/lib/utils'

type LectureDetailTabsSectionProps = {
  className?: string
  tabs: LectureDetailTabContent
  hideNotes?: boolean
}

export function LectureDetailTabsSection({
  className,
  tabs,
  hideNotes = false,
}: LectureDetailTabsSectionProps) {
  const [activeTabId, setActiveTabId] = useState<LectureDetailTabId>(() =>
    resolveDefaultLectureTabId(hideNotes),
  )

  return (
    <section
      className={cn(
        'border-b border-border bg-white px-4 py-5 md:px-6',
        className,
      )}
    >
      <LectureTabBar
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        hideNotes={hideNotes}
      />
      <LectureTabPanel key={activeTabId} tabId={activeTabId} tabs={tabs} />
    </section>
  )
}
