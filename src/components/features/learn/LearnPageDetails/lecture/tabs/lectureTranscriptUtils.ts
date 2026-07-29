import type { LectureTranscriptSegment } from '@/server/learn/lectureDetailTypes'

/** Format a transcript segment start (in seconds) as `m:ss` or `h:mm:ss`. */
export function formatTranscriptTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = safe % 60

  const pad2 = (value: number) => String(value).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(secs)}`
  }
  return `${minutes}:${pad2(secs)}`
}

/**
 * Flatten a transcript into the body of a downloadable `.txt`: one
 * `[timestamp] line` per segment, or the plain-text fallback for lectures
 * without structured segments. Returns an empty string when there is nothing
 * worth downloading, so callers can treat it as the "no file" signal.
 */
export function buildTranscriptDownloadText(
  segments: Array<LectureTranscriptSegment>,
  text: string | null,
): string {
  if (segments.length > 0) {
    return segments
      .map(
        (segment) =>
          `[${formatTranscriptTimestamp(segment.start)}] ${segment.text.trim()}`,
      )
      .join('\n')
  }

  return text?.trim() ?? ''
}

/** `lecture-42-transcript.txt`, or an unnumbered name when the id is unknown. */
export function buildTranscriptFileName(lectureId: number | null): string {
  return lectureId == null
    ? 'lecture-transcript.txt'
    : `lecture-${lectureId}-transcript.txt`
}
