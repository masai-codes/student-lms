'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { LectureVideoControlsToolbar } from './LectureVideoControlsToolbar'
import { LectureVideoProgressTrack } from './LectureVideoProgressTrack'
import {
  CHROME_HIDE_AFTER_MS,
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

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
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
    setChromeVisible(true)
    tryScheduleHide()
  }, [tryScheduleHide])

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

    host.addEventListener('pointerdown', onActivity)
    host.addEventListener('pointermove', onActivity)
    host.addEventListener('touchstart', onActivity, { passive: true })
    return () => {
      host.removeEventListener('pointerdown', onActivity)
      host.removeEventListener('pointermove', onActivity)
      host.removeEventListener('touchstart', onActivity)
    }
  }, [fullscreenContainerRef, bumpChromeActivity])

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

  const shellClass =
    `pointer-events-auto absolute bottom-0 left-0 right-0 z-[45] flex w-full min-w-0 flex-col bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-2 pt-10 text-white transition-opacity duration-300 ease-out ${
      chromeVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
    } ${className}`.trim()

  return (
    <div
      role="toolbar"
      aria-label="Video controls"
      className={shellClass}
      onFocusCapture={() => {
        setChromeVisible(true)
        clearHideTimer()
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
      />
    </div>
  )
}
