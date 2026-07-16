'use client'

import { useRef } from 'react'

type LectureVideoGestureLayerProps = {
  onTogglePlay: () => void
  onToggleFullscreen: () => void
  onSeekBySeconds: (delta: number) => void
}

const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_SLOP_PX = 80

/**
 * YouTube-style pointer surface over the video:
 * - mouse: click toggles play/pause, double-click toggles fullscreen
 * - touch: single tap only wakes the control chrome (handled by the host's
 *   touchstart listener); double-tap on the left/right third seeks ±5s and on
 *   the center toggles play/pause.
 *
 * Replaces the old `onClick` on the <video> itself, which made every
 * "show me the controls" tap on mobile also pause the video.
 */
export function LectureVideoGestureLayer({
  onTogglePlay,
  onToggleFullscreen,
  onSeekBySeconds,
}: LectureVideoGestureLayerProps) {
  const lastPointerTypeRef = useRef('mouse')
  const lastTapRef = useRef<{ time: number; x: number } | null>(null)

  return (
    <div
      className="absolute inset-0 z-30"
      // Kills iOS double-tap-to-zoom so our double-tap seek is reliable.
      style={{ touchAction: 'manipulation' }}
      aria-hidden
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        lastPointerTypeRef.current = event.pointerType
      }}
      onDoubleClick={() => {
        if (lastPointerTypeRef.current === 'mouse') onToggleFullscreen()
      }}
      onClick={(event) => {
        if (lastPointerTypeRef.current === 'mouse') {
          onTogglePlay()
          return
        }
        const now = Date.now()
        const x = event.clientX
        const last = lastTapRef.current
        if (
          last &&
          now - last.time < DOUBLE_TAP_MS &&
          Math.abs(x - last.x) < DOUBLE_TAP_SLOP_PX
        ) {
          lastTapRef.current = null
          const rect = event.currentTarget.getBoundingClientRect()
          const ratio = rect.width > 0 ? (x - rect.left) / rect.width : 0.5
          if (ratio < 0.35) onSeekBySeconds(-5)
          else if (ratio > 0.65) onSeekBySeconds(5)
          else onTogglePlay()
          return
        }
        lastTapRef.current = { time: now, x }
      }}
    />
  )
}
