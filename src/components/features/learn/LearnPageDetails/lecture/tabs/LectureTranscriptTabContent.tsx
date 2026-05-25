'use client'

import { ExpandableTabContent } from './ExpandableTabContent'
import { LectureTabEmptyState } from './LectureTabEmptyState'
import { LectureTabMarkdown } from './LectureTabMarkdown'
import { formatTranscriptTimestamp } from './lectureTranscriptUtils'

import type { LectureTranscriptSegment } from '@/server/learn/lectureDetailTypes'

type LectureTranscriptTabContentProps = {
  segments: Array<LectureTranscriptSegment>
  /** Plain-text fallback when no structured segments are present. */
  fallbackText: string | null
  emptyTitle: string
  emptyDescription: string
}

export function LectureTranscriptTabContent({
  segments,
  fallbackText,
  emptyTitle,
  emptyDescription,
}: LectureTranscriptTabContentProps) {
  if (segments.length === 0) {
    if (!fallbackText) {
      return (
        <LectureTabEmptyState title={emptyTitle} description={emptyDescription} />
      )
    }

    return (
      <ExpandableTabContent>
        <LectureTabMarkdown content={fallbackText} />
      </ExpandableTabContent>
    )
  }

  return (
    <ExpandableTabContent>
      <ol className="flex flex-col gap-3 list-none p-0 m-0">
        {segments.map(segment => (
          <li
            key={segment.id}
            className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <span
              aria-label={`Timestamp ${formatTranscriptTimestamp(segment.start)}`}
              className="type-b3-md shrink-0 font-mono tabular-nums text-blue-500"
            >
              {formatTranscriptTimestamp(segment.start)}
            </span>
            <span className="type-b2-regular text-gray-900">{segment.text}</span>
          </li>
        ))}
      </ol>
    </ExpandableTabContent>
  )
}
