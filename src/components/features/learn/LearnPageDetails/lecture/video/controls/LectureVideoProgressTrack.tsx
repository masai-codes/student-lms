'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  clampTime,
  formatVideoClock,
  isTouchLikePointer,
  scrubRatioFromClientX,
} from './lectureVideoChrome.utils'
import type { WatchIntervalSegment } from '@/server/video-attendance/types'
import { unwatchedGaps } from '@/lib/video-attendance/unwatchedGaps'

type LectureVideoProgressTrackProps = {
  totalDuration: number
  displaySeconds: number
  mergedIntervals: Array<WatchIntervalSegment>
  onSeekToSeconds: (seconds: number) => void
  onScrubPreview: (seconds: number | null) => void
  onSeekBySeconds: (delta: number) => void
  onActivity: () => void
}

export function LectureVideoProgressTrack({
  totalDuration,
  displaySeconds,
  mergedIntervals,
  onSeekToSeconds,
  onScrubPreview,
  onSeekBySeconds,
  onActivity,
}: LectureVideoProgressTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const lastScrubRatioRef = useRef<number | null>(null)
  const skipLostPointerCaptureRef = useRef(false)
  // Cursor position over the track — drives the YouTube-style hover time
  // bubble and the ghost preview fill. Null when the pointer is elsewhere.
  const [hoverRatio, setHoverRatio] = useState<number | null>(null)

  const elapsedPct =
    totalDuration > 0
      ? Math.min(
          100,
          (Math.min(displaySeconds, totalDuration) / totalDuration) * 100,
        )
      : 0
  const gaps =
    totalDuration > 0 ? unwatchedGaps(mergedIntervals, totalDuration) : []

  const ratioFromClientX = useCallback(
    (clientX: number) => scrubRatioFromClientX(trackRef.current, clientX),
    [],
  )

  const onTrackPointerDown = (event: React.PointerEvent) => {
    if (!(totalDuration > 0)) return
    if (isTouchLikePointer(event.pointerType)) event.preventDefault()
    onActivity()

    let ratio = ratioFromClientX(event.clientX)
    if (ratio === null) {
      ratio = clampTime(displaySeconds, totalDuration) / totalDuration
    }
    lastScrubRatioRef.current = ratio
    draggingRef.current = true
    onScrubPreview(ratio * totalDuration)
    trackRef.current?.setPointerCapture(event.pointerId)
  }

  const onTrackPointerMove = (event: React.PointerEvent) => {
    if (!(totalDuration > 0)) return
    const ratio = ratioFromClientX(event.clientX)
    // Track the cursor even without capture so the hover time bubble and
    // ghost fill follow the mouse before any click.
    if (ratio !== null) setHoverRatio(ratio)
    if (!trackRef.current?.hasPointerCapture(event.pointerId)) return
    if (isTouchLikePointer(event.pointerType)) event.preventDefault()
    onActivity()

    if (ratio === null) return
    lastScrubRatioRef.current = ratio
    onScrubPreview(ratio * totalDuration)
  }

  const endDrag = (event: React.PointerEvent) => {
    if (!(totalDuration > 0)) return
    // Touch has no hover: drop the time bubble as soon as the finger lifts.
    if (isTouchLikePointer(event.pointerType)) setHoverRatio(null)
    const isCancel = event.type === 'pointercancel'
    const ratio = ratioFromClientX(event.clientX) ?? lastScrubRatioRef.current

    skipLostPointerCaptureRef.current = true
    if (trackRef.current?.hasPointerCapture(event.pointerId)) {
      trackRef.current.releasePointerCapture(event.pointerId)
    }
    queueMicrotask(() => {
      skipLostPointerCaptureRef.current = false
    })

    draggingRef.current = false
    onScrubPreview(null)

    if (isCancel || ratio === null) {
      lastScrubRatioRef.current = null
      return
    }

    let target = clampTime(ratio * totalDuration, totalDuration)
    const lastRatio = lastScrubRatioRef.current
    if (target <= 0 && lastRatio !== null && lastRatio > 0.02) {
      target = clampTime(lastRatio * totalDuration, totalDuration)
    }

    onSeekToSeconds(target)
    lastScrubRatioRef.current = null
  }

  const onTrackLostPointerCapture = () => {
    if (skipLostPointerCaptureRef.current) return
    if (!draggingRef.current || !(totalDuration > 0)) return
    const ratio = lastScrubRatioRef.current
    if (ratio !== null) {
      onSeekToSeconds(clampTime(ratio * totalDuration, totalDuration))
    }
    draggingRef.current = false
    onScrubPreview(null)
    lastScrubRatioRef.current = null
  }

  useEffect(() => {
    draggingRef.current = false
  }, [totalDuration])

  return (
    <div className="flex w-full min-w-0 touch-none select-none flex-col pb-1 pt-0.5 md:pb-2">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(totalDuration)}
        aria-valuenow={Math.round(displaySeconds)}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerLeave={() => setHoverRatio(null)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={onTrackLostPointerCapture}
        onKeyDown={(event) => {
          onActivity()
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            event.stopPropagation()
            onSeekBySeconds(-5)
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            event.stopPropagation()
            onSeekBySeconds(5)
          }
        }}
        className="group relative flex min-h-[32px] w-full cursor-pointer touch-none select-none items-center rounded-full py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:min-h-[28px] md:py-2"
      >
        {/* Glass rail: translucent + blurred so the video shimmers through.
            Height stays constant — animating it on hover made the bar visibly
            shrink the instant the cursor left the player, fighting the chrome's
            fade-out. Hover feedback is carried by the brighter fill + the
            scrubber knob popping in, so the whole chrome fades as one unit. */}
        <div className="relative h-[4px] w-full overflow-hidden rounded-full bg-white/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-[background-color] duration-200 ease-out group-hover:bg-white/25 group-focus-visible:bg-white/25 md:h-[5px]">
          {totalDuration > 0 &&
            gaps.map((gap) => (
              <div
                key={`gap-${gap.start}-${gap.end}`}
                className="pointer-events-none absolute inset-y-0 z-[1] bg-white/30"
                style={{
                  left: `${(gap.start / totalDuration) * 100}%`,
                  width: `${((gap.end - gap.start) / totalDuration) * 100}%`,
                }}
              />
            ))}
          {totalDuration > 0 && elapsedPct > 0 ? (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[2] rounded-l-full bg-gradient-to-r from-white/75 via-white/90 to-white"
              style={{
                width: `${elapsedPct}%`,
                borderTopRightRadius: elapsedPct >= 99.9 ? 9999 : 0,
                borderBottomRightRadius: elapsedPct >= 99.9 ? 9999 : 0,
              }}
            />
          ) : null}
          {/* Ghost preview: faint fill up to the cursor, under the watched
              (green) segments so they stay vivid. */}
          {totalDuration > 0 && hoverRatio !== null ? (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[3] rounded-full bg-white/25"
              style={{ width: `${hoverRatio * 100}%` }}
            />
          ) : null}
          {totalDuration > 0 &&
            mergedIntervals.map((segment) => (
              <div
                key={`seg-${segment.start}-${segment.end}`}
                className="pointer-events-none absolute inset-y-0 z-[4] bg-gradient-to-r from-emerald-400 to-green-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                style={{
                  left: `${(segment.start / totalDuration) * 100}%`,
                  width: `${((segment.end - segment.start) / totalDuration) * 100}%`,
                }}
              />
            ))}
        </div>
        {/* Scrubber: pops in on hover (always visible on touch, which has no
            hover) with a soft halo glow, YouTube-style. */}
        {totalDuration > 0 ? (
          <div
            className="pointer-events-none absolute top-1/2 z-[5] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface shadow-[0_0_0_4px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.5)] ring-1 ring-white/40 transition-transform duration-150 ease-out group-active:scale-110 md:h-4 md:w-4 [@media(hover:hover)]:scale-0 [@media(hover:hover)]:group-hover:scale-110 [@media(hover:hover)]:group-focus-visible:scale-110 [@media(hover:hover)]:group-active:scale-110"
            style={{ left: `${elapsedPct}%` }}
            aria-hidden
          />
        ) : null}
        {/* Hover time bubble — frosted pill above the cursor, clamped so it
            never spills past the track edges. */}
        {totalDuration > 0 && hoverRatio !== null ? (
          <div
            className="pointer-events-none absolute bottom-full z-[6] mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-black/75 px-2 py-1 font-mono text-xs tabular-nums text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            style={{
              left: `clamp(1.75rem, ${hoverRatio * 100}%, calc(100% - 1.75rem))`,
            }}
            aria-hidden
          >
            {formatVideoClock(
              hoverRatio * totalDuration,
              totalDuration >= 3600,
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
