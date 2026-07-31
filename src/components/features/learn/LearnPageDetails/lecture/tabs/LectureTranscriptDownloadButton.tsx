'use client'

import { DownloadSimple } from '@phosphor-icons/react'

import {
  buildTranscriptDownloadText,
  buildTranscriptFileName,
} from './lectureTranscriptUtils'

import type { LectureTranscriptSegment } from '@/server/learn/lectureDetailTypes'
import { MasaiButton } from '@/components/ui/masai-button'
import { downloadTextFile } from '@/lib/downloadTextFile'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type LectureTranscriptDownloadButtonProps = {
  segments: Array<LectureTranscriptSegment>
  /** Plain-text fallback; only set for lectures without structured segments. */
  text: string | null
  /** From the fetched payload; null until it lands. */
  lectureId: number | null
}

/** Saves the already-fetched transcript as a `.txt` — no extra request. */
export function LectureTranscriptDownloadButton({
  segments,
  text,
  lectureId,
}: LectureTranscriptDownloadButtonProps) {
  const content = buildTranscriptDownloadText(segments, text)

  if (!content) return null

  const handleDownload = () => {
    pushLearnEvent(
      lectureId == null
        ? 'l_learn_lecture_transcript_download'
        : learnEntityEvent('lecture', 'transcript_download', lectureId),
      {
        tab: 'transcript',
        lectureId,
        segmentCount: segments.length,
        format: 'txt',
      },
    )
    downloadTextFile(buildTranscriptFileName(lectureId), content)
  }

  return (
    <MasaiButton
      data-testid="lecture-transcript-download-button"
      type="tertiary"
      size="sm"
      ctaText="Download"
      aria-label="Download transcript as a text file"
      icon={<DownloadSimple aria-hidden weight="bold" />}
      iconDirection="left"
      onClick={handleDownload}
      className="shrink-0 transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:scale-95 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:scale-110"
    />
  )
}
