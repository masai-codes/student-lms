'use client'

import type { LectureTranscriptSegment } from '@/server/learn/lectureDetailTypes'

type LectureVideoCaptionOverlayProps = {
  segments: Array<LectureTranscriptSegment>
  progressSeconds: number
  visible: boolean
}

/** Same timing as the transcript tab highlight: floor comparison on progress and segment bounds. */
function activeCaptionSegment(
  segments: Array<LectureTranscriptSegment>,
  progressSeconds: number,
): LectureTranscriptSegment | null {
  const t = Math.floor(progressSeconds)
  for (const seg of segments) {
    if (t >= Math.floor(seg.start) && t < Math.floor(seg.end)) {
      return seg
    }
  }
  return null
}

export function LectureVideoCaptionOverlay({
  segments,
  progressSeconds,
  visible,
}: LectureVideoCaptionOverlayProps) {
  if (!visible || segments.length === 0) return null

  const active = activeCaptionSegment(segments, progressSeconds)
  if (!active?.text?.trim()) return null

  return (
    <output
      className="pointer-events-none absolute bottom-14 left-0 right-0 z-[42] m-0 flex justify-center border-0 p-0 px-3 md:bottom-16"
      aria-live="polite"
    >
      <span className="max-w-[min(100%,42rem)] rounded-md bg-black/75 px-3 py-2 text-center text-sm leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
        {active.text}
      </span>
    </output>
  )
}
