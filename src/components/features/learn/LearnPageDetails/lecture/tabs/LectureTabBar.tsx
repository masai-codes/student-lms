'use client'

import { MasaiTab } from '@/components/ui/masai-tab'
import { cn } from '@/lib/utils'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

import {
  resolveVisibleLectureDetailTabs,
  type LectureDetailTabId,
} from './constants/staticLectureTabContent'

type LectureTabBarProps = {
  activeTabId: LectureDetailTabId
  onTabChange: (tabId: LectureDetailTabId) => void
  hideNotes: boolean
  className?: string
}

export function LectureTabBar({
  activeTabId,
  onTabChange,
  hideNotes,
  className,
}: LectureTabBarProps) {
  const tabs = resolveVisibleLectureDetailTabs(hideNotes)

  return (
    <div
      role="tablist"
      aria-label="Lecture details"
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {tabs.map((tab) => (
        <MasaiTab
          key={tab.id}
          label={tab.label}
          selected={activeTabId === tab.id}
          onClick={() => {
            pushLearnEvent('l_learn_lecture_tab_change', { tab: tab.id })
            onTabChange(tab.id)
          }}
          className="shrink-0 whitespace-nowrap transition-all duration-200 hover:-translate-y-px hover:shadow-sm active:translate-y-0 active:scale-[0.97]"
        />
      ))}
    </div>
  )
}
