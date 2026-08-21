'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { LectureVideoControlsToolbar } from './LectureVideoControlsToolbar'
import { LectureVideoProgressTrack } from './LectureVideoProgressTrack'
import {
  CHROME_HIDE_AFTER_MS,
  CHROME_HIDE_ON_LEAVE_MS,
  POINTER_MOVE_WAKE_INTERVAL_MS,
  SEEK_ALIGNMENT_EPSILON,
} from './lectureVideoChrome.constants'
import { clampTime } from './lectureVideoChrome.utils'
import type { LectureChromePlayerRef } from './lectureVideoChrome.utils'
import type { LectureVideoQualityLevel } from '../hooks/useLectureVideoAttendance'
import type { WatchIntervalSegment } from '@/server/video-attendance/types'

type VideoAttendanceCustomControlsProps = {
  videoRef: React.MutableRefObject<LectureChromePlayerRef>
  totalDuration: number
  playedSeconds: number
  mergedIntervals: Array<WatchIntervalSegment>
  isPlaying: boolean
  fullscreenContainerRef: React.RefObject<HTMLDivElement | null>
  onSeekBySeconds: (delta: number) => void
  onSeekToSeconds: (seconds: number) => void
  playerReadyVersion: number
  playbackRate: number
  onPlaybackRateChange: (rate: number) => void
  qualityLevels: Array<LectureVideoQualityLevel>
  currentQuality: number
  onQualityChange: (levelIndex: number) => void
  transcriptAvailable: boolean
  captionsOn: boolean
  onCaptionsToggle: () => void
  /** Opens the lecture AI chat; the toolbar's "Ask AI" pill renders only when provided. */
  onOpenAiChat?: () => void
  /** Reports auto-hide chrome visibility (e.g. so captions can lift above the progress bar). */
  onChromeVisibleChange?: (visible: boolean) => void
  className?: string
}

export function VideoAttendanceCustomControls({
  videoRef,
  totalDuration,
  playedSeconds,
  mergedIntervals,
  isPlaying,
  fullscreenContainerRef,
  onSeekBySeconds,
  onSeekToSeconds,
  playerReadyVersion,
  playbackRate,
  onPlaybackRateChange,
  qualityLevels,
  currentQuality,
  onQualityChange,
  transcriptAvailable,
  captionsOn,
  onCaptionsToggle,
  onOpenAiChat,
  onChromeVisibleChange,
  className = '',
}: VideoAttendanceCustomControlsProps) {
  const [scrubPreviewSeconds, setScrubPreviewSeconds] = useState<number | null>(
    null,
  )
  const [committedSeekSeconds, setCommittedSeekSeconds] = useState<
    number | null
  >(null)
  const [chromeVisible, setChromeVisible] = useState(true)
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false)
  const hideTimerRef = useRef<number | null>(null)
  const leaveHideTimerRef = useRef<number | null>(null)
  const lastPointerMoveWakeAtRef = useRef(0)
  const isPlayingRef = useRef(isPlaying)
  const overflowMenuOpenRef = useRef(overflowMenuOpen)

  const displaySecondsRaw =
    scrubPreviewSeconds !== null
      ? scrubPreviewSeconds
      : committedSeekSeconds !== null
        ? committedSeekSeconds
        : playedSeconds

  const displaySeconds =
    totalDuration > 0
      ? clampTime(
          Number.isFinite(displaySecondsRaw) ? displaySecondsRaw : 0,
          totalDuration,
        )
      : Number.isFinite(displaySecondsRaw) && displaySecondsRaw >= 0
        ? displaySecondsRaw
        : 0

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    overflowMenuOpenRef.current = overflowMenuOpen
  }, [overflowMenuOpen])

  useEffect(() => {
    onChromeVisibleChange?.(chromeVisible)
  }, [chromeVisible, onChromeVisibleChange])

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const clearLeaveHideTimer = useCallback(() => {
    if (leaveHideTimerRef.current !== null) {
      window.clearTimeout(leaveHideTimerRef.current)
      leaveHideTimerRef.current = null
    }
  }, [])

  const tryScheduleHide = useCallback(() => {
    clearHideTimer()
    if (!isPlayingRef.current) return
    // Don't hide the chrome while the overflow menu is open — hiding it would
    // orphan an open native <select> (quality / speed) dropdown on screen.
    if (overflowMenuOpenRef.current) return
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      if (!isPlayingRef.current || overflowMenuOpenRef.current) return
      setChromeVisible(false)
    }, CHROME_HIDE_AFTER_MS)
  }, [clearHideTimer])

  const bumpChromeActivity = useCallback(() => {
    // Any activity inside the player cancels a pending hover-out fade.
    clearLeaveHideTimer()
    setChromeVisible(true)
    tryScheduleHide()
  }, [tryScheduleHide, clearLeaveHideTimer])

  // YouTube-style hover-out: leaving the player fades the chrome away (via the
  // same 300ms opacity/transform transition) after a short grace period, so a
  // quick or accidental exit doesn't read as an abrupt cut. Runs whether the
  // video is playing or paused; only an open dropdown keeps it pinned.
  const scheduleHideOnLeave = useCallback(() => {
    clearHideTimer()
    clearLeaveHideTimer()
    if (overflowMenuOpenRef.current) return
    leaveHideTimerRef.current = window.setTimeout(() => {
      leaveHideTimerRef.current = null
      if (overflowMenuOpenRef.current) return
      setChromeVisible(false)
    }, CHROME_HIDE_ON_LEAVE_MS)
  }, [clearHideTimer, clearLeaveHideTimer])

  useEffect(() => {
    if (!isPlaying) {
      clearHideTimer()
      setChromeVisible(true)
      return
    }
    bumpChromeActivity()
    return clearHideTimer
  }, [isPlaying, bumpChromeActivity, clearHideTimer])

  useEffect(() => {
    if (overflowMenuOpen) {
      setChromeVisible(true)
      clearHideTimer()
    } else {
      tryScheduleHide()
    }
  }, [overflowMenuOpen, clearHideTimer, tryScheduleHide])

  useEffect(() => {
    const host = fullscreenContainerRef.current
    if (!host) return

    const onActivity = (event: Event) => {
      if (event.type === 'pointermove') {
        const now = Date.now()
        if (
          now - lastPointerMoveWakeAtRef.current <
          POINTER_MOVE_WAKE_INTERVAL_MS
        ) {
          return
        }
        lastPointerMoveWakeAtRef.current = now
      } else {
        lastPointerMoveWakeAtRef.current = 0
      }
      bumpChromeActivity()
    }

    const onPointerLeave = (event: PointerEvent) => {
      // Touch/pen have no real "hover out"; leave those to the inactivity
      // timer so the chrome doesn't vanish the instant a tap ends.
      if (event.pointerType !== 'mouse') return
      lastPointerMoveWakeAtRef.current = 0
      scheduleHideOnLeave()
    }

    host.addEventListener('pointerdown', onActivity)
    host.addEventListener('pointermove', onActivity)
    host.addEventListener('touchstart', onActivity, { passive: true })
    host.addEventListener('pointerleave', onPointerLeave)
    return () => {
      host.removeEventListener('pointerdown', onActivity)
      host.removeEventListener('pointermove', onActivity)
      host.removeEventListener('touchstart', onActivity)
      host.removeEventListener('pointerleave', onPointerLeave)
      clearLeaveHideTimer()
    }
  }, [
    fullscreenContainerRef,
    bumpChromeActivity,
    scheduleHideOnLeave,
    clearLeaveHideTimer,
  ])

  useEffect(() => {
    if (committedSeekSeconds === null) return
    if (
      Number.isFinite(playedSeconds) &&
      Math.abs(playedSeconds - committedSeekSeconds) <= SEEK_ALIGNMENT_EPSILON
    ) {
      setCommittedSeekSeconds(null)
    }
  }, [playedSeconds, committedSeekSeconds])

  useEffect(() => {
    if (committedSeekSeconds === null) return
    const committed = committedSeekSeconds
    const failSafe = window.setTimeout(() => {
      setCommittedSeekSeconds((previous) =>
        previous === committed ? null : previous,
      )
    }, 3000)
    return () => window.clearTimeout(failSafe)
  }, [committedSeekSeconds])

  const handleSeekToSeconds = (seconds: number) => {
    onSeekToSeconds(seconds)
    setCommittedSeekSeconds(seconds)
  }

  // A soft scrim keeps the glass pills legible on bright footage; the pills
  // themselves carry most of the contrast, so it stays much lighter than a
  // classic control gradient.
  // Promote the chrome onto its own GPU layer (transform-gpu + will-change) so
  // the opacity fade runs on the compositor thread — otherwise the progress
  // bar's per-frame repaints (while playing) stutter the transition on the
  // main thread. Pure opacity fade (no translate): a positional slide reads as
  // the chrome "dropping" before it fades, a second motion competing with the
  // fade. A longer duration + gentle ease reads as a soft, soothing fade;
  // motion-reduce disables it.
  const shellClass =
    `pointer-events-auto absolute bottom-0 left-0 right-0 z-[45] flex w-full min-w-0 flex-col bg-gradient-to-t from-black/60 via-black/25 to-transparent pt-10 text-white transform-gpu will-change-[opacity] transition-opacity duration-[600ms] ease-[cubic-bezier(0.33,0,0.2,1)] motion-reduce:transition-none ${
      chromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
    } ${className}`.trim()

  return (
    <div
      role="toolbar"
      aria-label="Video controls"
      className={shellClass}
      // The player container already pads the left/right safe areas (camera
      // housing); the chrome only needs to clear the home indicator below.
      style={{
        paddingLeft: '0.75rem',
        paddingRight: '0.75rem',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
      }}
      onFocusCapture={() => {
        setChromeVisible(true)
        clearHideTimer()
        clearLeaveHideTimer()
      }}
    >
      <LectureVideoProgressTrack
        totalDuration={totalDuration}
        displaySeconds={displaySeconds}
        mergedIntervals={mergedIntervals}
        onSeekToSeconds={handleSeekToSeconds}
        onScrubPreview={setScrubPreviewSeconds}
        onSeekBySeconds={onSeekBySeconds}
        onActivity={bumpChromeActivity}
      />
      <LectureVideoControlsToolbar
        videoRef={videoRef}
        playerReadyVersion={playerReadyVersion}
        totalDuration={totalDuration}
        displaySeconds={displaySeconds}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        onPlaybackRateChange={onPlaybackRateChange}
        qualityLevels={qualityLevels}
        currentQuality={currentQuality}
        onQualityChange={onQualityChange}
        fullscreenContainerRef={fullscreenContainerRef}
        onActivity={bumpChromeActivity}
        transcriptAvailable={transcriptAvailable}
        captionsOn={captionsOn}
        onCaptionsToggle={onCaptionsToggle}
        chromeVisible={chromeVisible}
        onMenuOpenChange={setOverflowMenuOpen}
        onOpenAiChat={onOpenAiChat}
      />
    </div>
  )
}
