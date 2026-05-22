import { SEEK_ALIGNMENT_EPSILON } from '../controls/lectureVideoChrome.constants'
import type { MutableRefObject } from 'react'

import type { LectureChromePlayerRef } from '../controls/lectureVideoChrome.utils'

type SeekablePlayer = {
  seekTo?: (value: number, unit: 'seconds' | 'fraction') => void
  getCurrentTime?: () => number
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
}): void {
  const { videoRef, resumeSeconds, resumeAppliedRef, onApplied } = params
  if (
    resumeSeconds === null ||
    resumeSeconds <= SEEK_ALIGNMENT_EPSILON ||
    resumeAppliedRef.current
  ) {
    return
  }

  const player = videoRef.current as SeekablePlayer | null
  if (!player?.seekTo) return

  const currentTime =
    typeof player.getCurrentTime === 'function' ? player.getCurrentTime() || 0 : 0
  if (currentTime >= resumeSeconds - SEEK_ALIGNMENT_EPSILON) {
    resumeAppliedRef.current = true
    return
  }

  player.seekTo(resumeSeconds, 'seconds')
  resumeAppliedRef.current = true
  onApplied(resumeSeconds)
}
