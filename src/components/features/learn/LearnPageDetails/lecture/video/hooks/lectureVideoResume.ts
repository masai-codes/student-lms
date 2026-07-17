import { SEEK_ALIGNMENT_EPSILON } from '../controls/lectureVideoChrome.constants'
import type { MutableRefObject } from 'react'

import type { LectureChromePlayerRef } from '../controls/lectureVideoChrome.utils'

type SeekablePlayer = {
  seekTo?: (value: number, unit: 'seconds' | 'fraction') => void
  getCurrentTime?: () => number
  getDuration?: () => number | null
}

export function seekPlayerToSeconds(
  videoRef: MutableRefObject<LectureChromePlayerRef>,
  seconds: number,
): boolean {
  const player = videoRef.current as SeekablePlayer | null
  if (!player?.seekTo) return false
  player.seekTo(seconds, 'seconds')
  return true
}

export function applyResumeIfNeeded(params: {
  videoRef: MutableRefObject<LectureChromePlayerRef>
  resumeSeconds: number | null
  resumeAppliedRef: MutableRefObject<boolean>
  onApplied: (seconds: number) => void
  /**
   * Only seek if the player has actually reached ready state. react-player
   * swallows a pre-ready seekTo into an internal `seekOnPlay` that EXPIRES
   * after 5s and only fires on play — so seeking too early both fails AND
   * (without this guard) consumes the one-shot resume latch, leaving MP4s
   * starting at 0. When the player isn't ready we return WITHOUT latching so
   * the onReady-driven call can apply the resume for real. Callers that run
   * from a ready/parsed event (handleReady, MANIFEST_PARSED) omit this.
   */
  requireReady?: boolean
}): void {
  const { videoRef, resumeSeconds, resumeAppliedRef, onApplied, requireReady } =
    params
  if (
    resumeSeconds === null ||
    resumeSeconds <= SEEK_ALIGNMENT_EPSILON ||
    resumeAppliedRef.current
  ) {
    return
  }

  const player = videoRef.current as SeekablePlayer | null
  if (!player?.seekTo) return

  if (requireReady) {
    // ReactPlayer.getDuration() returns null until the internal player is
    // ready — a provider-agnostic readiness signal (file/MP4 and YouTube).
    const duration =
      typeof player.getDuration === 'function' ? player.getDuration() : null
    if (!duration) return
  }

  const currentTime =
    typeof player.getCurrentTime === 'function'
      ? player.getCurrentTime() || 0
      : 0
  if (currentTime >= resumeSeconds - SEEK_ALIGNMENT_EPSILON) {
    resumeAppliedRef.current = true
    return
  }

  player.seekTo(resumeSeconds, 'seconds')
  resumeAppliedRef.current = true
  onApplied(resumeSeconds)
}
