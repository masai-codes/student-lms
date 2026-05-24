'use client'

import { AssociatedContentList } from '../../common/associated/AssociatedContentList'
import { ExpandableTabContent } from './ExpandableTabContent'
import { LectureNotesTabContent } from './LectureNotesTabContent'
import { LectureTabEmptyState } from './LectureTabEmptyState'
import { LectureTabMarkdown } from './LectureTabMarkdown'
import type { LectureDetailTabId } from './constants/staticLectureTabContent'

import type { LectureDetailTabContent } from '@/server/learn/lectureDetailTypes'

const LECTURE_TAB_CONTENT_KEY: Record<
  Exclude<LectureDetailTabId, 'notes' | 'associated'>,
  keyof Pick<
    LectureDetailTabContent,
    'description' | 'aiSummary' | 'transcript'
  >
> = {
  description: 'description',
  'ai-summary': 'aiSummary',
  transcript: 'transcript',
}

const TAB_EMPTY_COPY: Record<
  Exclude<LectureDetailTabId, 'notes'>,
  { title: string; description: string }
> = {
  description: {
    title: 'No description yet',
    description: 'A description has not been added for this lecture.',
  },
  'ai-summary': {
    title: 'AI summary not available',
    description:
      'The summary will appear here once it has been generated and published for this lecture.',
  },
  transcript: {
    title: 'Transcript not available',
    description:
      'The transcript will appear here once it has been processed for this lecture.',
  },
  associated: {
    title: 'No associated content',
    description:
      'There are no linked lectures, assignments, or resources for this session yet.',
  },
}

type LectureTabPanelProps = {
  tabId: LectureDetailTabId
  tabs: LectureDetailTabContent
}

function renderMarkdownTab(
  tabId: Exclude<LectureDetailTabId, 'notes' | 'associated'>,
  content: string | null,
) {
  if (!content) {
    const copy = TAB_EMPTY_COPY[tabId]
    return <LectureTabEmptyState title={copy.title} description={copy.description} />
  }

  return (
    <ExpandableTabContent>
      <LectureTabMarkdown content={content} />
    </ExpandableTabContent>
  )
}

export function LectureTabPanel({ tabId, tabs }: LectureTabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`lecture-tab-panel-${tabId}`}
      aria-labelledby={`lecture-tab-${tabId}`}
      className="pt-0"
    >
      <div className="rounded-xl bg-gray-100 px-4 py-3 ring-1 ring-gray-200/80">
        {tabId === 'notes' ? (
          <LectureNotesTabContent notes={tabs.notes} />
        ) : tabId === 'associated' ? (
          tabs.associatedItems.length === 0 ? (
            <LectureTabEmptyState
              title={TAB_EMPTY_COPY.associated.title}
              description={TAB_EMPTY_COPY.associated.description}
            />
          ) : (
            <ExpandableTabContent>
              <AssociatedContentList items={tabs.associatedItems} />
            </ExpandableTabContent>
          )
        ) : (
          renderMarkdownTab(tabId, tabs[LECTURE_TAB_CONTENT_KEY[tabId]])
        )}
      </div>
    </div>
  )
}
