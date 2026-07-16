'use client'

import { useCallback, useEffect, useRef } from 'react'

import {
  clampTime,
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
    if (!trackRef.current?.hasPointerCapture(event.pointerId)) return
    if (!(totalDuration > 0)) return
    if (isTouchLikePointer(event.pointerType)) event.preventDefault()
    onActivity()

    const ratio = ratioFromClientX(event.clientX)
    if (ratio === null) return
    lastScrubRatioRef.current = ratio
    onScrubPreview(ratio * totalDuration)
  }

  const endDrag = (event: React.PointerEvent) => {
    if (!(totalDuration > 0)) return
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
    <div className="flex w-full min-w-0 touch-none select-none flex-col pb-2 pt-0.5">
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
        className="relative flex min-h-[44px] w-full cursor-pointer touch-none select-none items-center py-2 outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 md:min-h-[28px]"
      >
        <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#6B7280] md:h-1">
          {totalDuration > 0 &&
            gaps.map((gap) => (
              <div
                key={`gap-${gap.start}-${gap.end}`}
                className="pointer-events-none absolute inset-y-0 z-[1] bg-[#9CA3AF]"
                style={{
                  left: `${(gap.start / totalDuration) * 100}%`,
                  width: `${((gap.end - gap.start) / totalDuration) * 100}%`,
                }}
              />
            ))}
          {totalDuration > 0 && elapsedPct > 0 ? (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[2] rounded-l-full bg-surface"
              style={{
                width: `${elapsedPct}%`,
                borderTopRightRadius: elapsedPct >= 99.9 ? 9999 : 0,
                borderBottomRightRadius: elapsedPct >= 99.9 ? 9999 : 0,
              }}
            />
          ) : null}
          {totalDuration > 0 &&
            mergedIntervals.map((segment) => (
              <div
                key={`seg-${segment.start}-${segment.end}`}
                className="pointer-events-none absolute inset-y-0 z-[4] bg-[#22C55E]"
                style={{
                  left: `${(segment.start / totalDuration) * 100}%`,
                  width: `${((segment.end - segment.start) / totalDuration) * 100}%`,
                }}
              />
            ))}
        </div>
        {totalDuration > 0 ? (
          <div
            className="pointer-events-none absolute top-1/2 z-[5] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.45)] ring-1 ring-black/25 md:h-3 md:w-3"
            style={{ left: `${elapsedPct}%` }}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  )
}
