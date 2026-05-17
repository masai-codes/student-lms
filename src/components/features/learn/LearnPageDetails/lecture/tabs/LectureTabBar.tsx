'use client'

import { MasaiTab } from '@/components/ui/masai-tab'
import { cn } from '@/lib/utils'

import {
  LECTURE_DETAIL_TABS,
  type LectureDetailTabId,
} from './constants/staticLectureTabContent'

type LectureTabBarProps = {
  activeTabId: LectureDetailTabId
  onTabChange: (tabId: LectureDetailTabId) => void
  className?: string
}

export function LectureTabBar({
  activeTabId,
  onTabChange,
  className,
}: LectureTabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Lecture details"
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {LECTURE_DETAIL_TABS.map(tab => (
        <MasaiTab
          key={tab.id}
          label={tab.label}
          selected={activeTabId === tab.id}
          onClick={() => onTabChange(tab.id)}
          className="shrink-0 whitespace-nowrap"
        />
      ))}
    </div>
  )
}
