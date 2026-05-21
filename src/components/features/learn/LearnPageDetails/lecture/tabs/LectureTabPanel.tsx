'use client'

import { ExpandableTabContent } from './ExpandableTabContent'
import { LectureNotesTabContent } from './LectureNotesTabContent'
import { LectureTabMarkdown } from './LectureTabMarkdown'
import {
  STATIC_LECTURE_TAB_CONTENT,
  type LectureDetailTabId,
} from './constants/staticLectureTabContent'

import { cn } from '@/lib/utils'

type LectureTabPanelProps = {
  tabId: LectureDetailTabId
  notes: string | null
}

export function LectureTabPanel({ tabId, notes }: LectureTabPanelProps) {
  const isNotesTab = tabId === 'notes'

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
        {isNotesTab ? (
          <LectureNotesTabContent notes={notes} />
        ) : (
          <ExpandableTabContent>
            <LectureTabMarkdown content={STATIC_LECTURE_TAB_CONTENT[tabId]} />
          </ExpandableTabContent>
        )}
      </div>
    </div>
  )
}
