'use client'

import { AssociatedContentList } from '../../common/associated/AssociatedContentList'
import { AttemptedAssessmentsTabContent } from './AttemptedAssessmentsTabContent'
import { ExpandableTabContent } from './ExpandableTabContent'
import { LectureNotesTabContent } from './LectureNotesTabContent'
import { LectureTabEmptyState } from './LectureTabEmptyState'
import { LectureTabMarkdown } from './LectureTabMarkdown'
import { LectureTranscriptTabContent } from './LectureTranscriptTabContent'
import type { LectureDetailTabId } from './constants/staticLectureTabContent'

import type {
  InLecturePopupElements,
  LectureDetailTabContent,
} from '@/server/learn/lectureDetailTypes'

type MarkdownTabId = Extract<LectureDetailTabId, 'ai-summary'>

const MARKDOWN_TAB_FIELD: Record<
  MarkdownTabId,
  keyof Pick<LectureDetailTabContent, 'aiSummary'>
> = {
  'ai-summary': 'aiSummary',
}

const TAB_EMPTY_COPY: Record<
  Exclude<LectureDetailTabId, 'description' | 'attempted-assessments'>,
  { title: string; description: string }
> = {
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
  /** Only needed for the 'attempted-assessments' tab; other tabs ignore it. */
  inLecturePopupElements?: InLecturePopupElements
  /** Only needed for the 'attempted-assessments' tab; other tabs ignore it. */
  lectureId?: number
}

function renderMarkdownTab(tabId: MarkdownTabId, content: string | null) {
  if (!content) {
    const copy = TAB_EMPTY_COPY[tabId]
    return (
      <LectureTabEmptyState title={copy.title} description={copy.description} />
    )
  }

  return (
    <ExpandableTabContent>
      <LectureTabMarkdown content={content} />
    </ExpandableTabContent>
  )
}

function renderTabBody(
  tabId: LectureDetailTabId,
  tabs: LectureDetailTabContent,
  inLecturePopupElements: InLecturePopupElements | undefined,
  lectureId: number | undefined,
) {
  if (tabId === 'description') {
    return <LectureNotesTabContent notes={tabs.notes} />
  }

  if (tabId === 'attempted-assessments') {
    // Only reachable when the tab bar decided to show it, which already
    // requires at least one submitted quiz or poll — see
    // `hasAttemptedAssessments`. Both the submitted and still-pending
    // quizzes/polls are passed through — the tab content splits them.
    if (lectureId == null) return null
    return (
      <AttemptedAssessmentsTabContent
        lectureId={lectureId}
        quizzes={inLecturePopupElements?.quiz ?? []}
        polls={inLecturePopupElements?.polls ?? []}
      />
    )
  }

  if (tabId === 'associated') {
    if (tabs.associatedItems.length === 0) {
      return (
        <LectureTabEmptyState
          title={TAB_EMPTY_COPY.associated.title}
          description={TAB_EMPTY_COPY.associated.description}
        />
      )
    }
    return (
      <ExpandableTabContent>
        <AssociatedContentList items={tabs.associatedItems} />
      </ExpandableTabContent>
    )
  }

  if (tabId === 'transcript') {
    return (
      <LectureTranscriptTabContent
        transcript={tabs.transcript}
        emptyTitle={TAB_EMPTY_COPY.transcript.title}
        emptyDescription={TAB_EMPTY_COPY.transcript.description}
      />
    )
  }

  return renderMarkdownTab(tabId, tabs[MARKDOWN_TAB_FIELD[tabId]])
}

export function LectureTabPanel({
  tabId,
  tabs,
  inLecturePopupElements,
  lectureId,
}: LectureTabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`lecture-tab-panel-${tabId}`}
      aria-labelledby={`lecture-tab-${tabId}`}
      className="pt-0"
    >
      {/* Remounts per tab (keyed by tabId upstream), replaying the entrance. */}
      <div className="animate-dash-row-in rounded-xl bg-surface-muted px-4 py-3 ring-1 ring-border/80 dark:bg-surface">
        {renderTabBody(tabId, tabs, inLecturePopupElements, lectureId)}
      </div>
    </div>
  )
}
