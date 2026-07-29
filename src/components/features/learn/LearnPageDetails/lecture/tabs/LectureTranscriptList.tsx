'use client'

import { formatTranscriptTimestamp } from './lectureTranscriptUtils'

import type { LectureTranscriptSegment } from '@/server/learn/lectureDetailTypes'

type LectureTranscriptListProps = {
  segments: Array<LectureTranscriptSegment>
}

/** Timestamped transcript lines, staggered in as the lazily-fetched data lands. */
export function LectureTranscriptList({
  segments,
}: LectureTranscriptListProps) {
  return (
    <ol
      data-testid="lecture-transcript-list"
      className="flex flex-col gap-3 list-none p-0 m-0"
    >
      {segments.map((segment, index) => (
        <li
          key={segment.id}
          data-testid="lecture-transcript-segment"
          className="animate-dash-row-in flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
          style={
            {
              // Cap the cumulative delay so a long transcript still feels instant.
              '--dash-delay': `${Math.min(index, 8) * 0.04}s`,
            } as React.CSSProperties
          }
        >
          <span
            aria-label={`Timestamp ${formatTranscriptTimestamp(segment.start)}`}
            className="type-b3-md shrink-0 font-mono tabular-nums text-brand"
          >
            {formatTranscriptTimestamp(segment.start)}
          </span>
          <span className="type-b2-regular text-foreground">
            {segment.text}
          </span>
        </li>
      ))}
    </ol>
  )
}
