'use client'

import { ExpandableTabContent } from './ExpandableTabContent'
import { LectureTabEmptyState } from './LectureTabEmptyState'
import { LectureTabMarkdown } from './LectureTabMarkdown'
import { LectureTranscriptList } from './LectureTranscriptList'
import { LectureTranscriptSkeleton } from './LectureTranscriptSkeleton'
import { useLectureTranscript } from '../hooks/useLectureTranscript'

import type { LectureTranscriptSource } from '@/server/learn/lectureDetailTypes'

type LectureTranscriptTabContentProps = {
  transcript: LectureTranscriptSource
  emptyTitle: string
  emptyDescription: string
}

/**
 * Fetches the transcript on mount — this panel is only mounted while the
 * Transcript tab is the active one, so opening the tab *is* the trigger.
 */
export function LectureTranscriptTabContent({
  transcript,
  emptyTitle,
  emptyDescription,
}: LectureTranscriptTabContentProps) {
  const { segments, text, isLoading, isError, hasContent } =
    useLectureTranscript(transcript, true)

  if (!transcript.available) {
    return (
      <LectureTabEmptyState title={emptyTitle} description={emptyDescription} />
    )
  }

  if (isLoading) {
    return <LectureTranscriptSkeleton />
  }

  if (isError) {
    return (
      <LectureTabEmptyState
        title="Couldn't load the transcript"
        description="Something went wrong fetching this lecture's transcript. Reopen this tab to try again."
      />
    )
  }

  if (!hasContent) {
    return (
      <LectureTabEmptyState title={emptyTitle} description={emptyDescription} />
    )
  }

  return (
    <div data-testid="lecture-transcript-tab" className="flex flex-col gap-3">
      <ExpandableTabContent>
        {segments.length > 0 ? (
          <LectureTranscriptList segments={segments} />
        ) : (
          <LectureTabMarkdown content={text as string} />
        )}
      </ExpandableTabContent>
    </div>
  )
}
