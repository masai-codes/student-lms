'use client'

import { ExpandableTabContent } from './ExpandableTabContent'
import { LectureTabMarkdown } from './LectureTabMarkdown'
import {
  STATIC_LECTURE_TAB_CONTENT,
  type LectureDetailTabId,
} from './constants/staticLectureTabContent'

import { cn } from '@/lib/utils'

type LectureTabPanelProps = {
  tabId: LectureDetailTabId
}

export function LectureTabPanel({ tabId }: LectureTabPanelProps) {
  const content = STATIC_LECTURE_TAB_CONTENT[tabId]

  return (
    <div
      role="tabpanel"
      id={`lecture-tab-panel-${tabId}`}
      aria-labelledby={`lecture-tab-${tabId}`}
      className="pt-0"
    >
      <div
        className={cn(
          'rounded-xl bg-gray-100 px-4 py-3',
          'ring-1 ring-gray-200/80',
        )}
      >
        <ExpandableTabContent>
          <LectureTabMarkdown content={content} />
        </ExpandableTabContent>
      </div>
    </div>
  )
}
