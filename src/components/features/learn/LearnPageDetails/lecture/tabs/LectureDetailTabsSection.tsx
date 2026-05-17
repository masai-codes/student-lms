'use client'

import { useState } from 'react'

import { LectureTabBar } from './LectureTabBar'
import { LectureTabPanel } from './LectureTabPanel'
import { DEFAULT_LECTURE_TAB_ID, type LectureDetailTabId } from './constants/staticLectureTabContent'

import { cn } from '@/lib/utils'

type LectureDetailTabsSectionProps = {
  className?: string
}

export function LectureDetailTabsSection({
  className,
}: LectureDetailTabsSectionProps) {
  const [activeTabId, setActiveTabId] =
    useState<LectureDetailTabId>(DEFAULT_LECTURE_TAB_ID)

  return (
    <section
      className={cn(
        'border-b border-border bg-white px-4 py-5 md:px-6',
        className,
      )}
    >
      <LectureTabBar activeTabId={activeTabId} onTabChange={setActiveTabId} />
      <LectureTabPanel key={activeTabId} tabId={activeTabId} />
    </section>
  )
}
