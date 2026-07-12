'use client'

import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

import { SEEK_ALIGNMENT_EPSILON } from '../controls/lectureVideoChrome.constants'
import { applyResumeIfNeeded, seekPlayerToSeconds } from './lectureVideoResume'
import { useTimer } from './useTimer'
import type { LectureChromePlayerRef } from '../controls/lectureVideoChrome.utils'
import type { OnProgressProps } from 'react-player/base'
import type { LectureVideoAttendanceState } from '@/server/learn/lectureDetailTypes'
import {
  nextVideoProgressRetryAt,
  shouldSaveVideoProgress,
} from '@/lib/video-attendance/videoProgressSavePolicy'
import { storeLectureVideoProgressViaApi } from '@/lib/api/learn/videoProgressApi'

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8')
}

type UseLectureVideoAttendanceOptions = {
  lectureId: number
  src: string
  videoRef: React.MutableRefObject<LectureChromePlayerRef>
  initialAttendance: LectureVideoAttendanceState | null
}

export function useLectureVideoAttendance({
  lectureId,
  src,
  videoRef,
  initialAttendance,
}: UseLectureVideoAttendanceOptions) {
  const router = useRouter()
  const isHls = isHlsUrl(src)

  const [progress, setProgress] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [playerReadyVersion, setPlayerReadyVersion] = useState(0)
  const [seekHint, setSeekHint] = useState<'forward' | 'backward' | null>(null)
  const [mergedAttendanceIntervals, setMergedAttendanceIntervals] = useState(
    () => initialAttendance?.mergedIntervals ?? [],
  )

  const isVideoPausedRef = useRef<boolean | null>(null)
  const isUpdatingRef = useRef(false)
  const startTimeRef = useRef(0)
  const endTimeRef = useRef(0)
  const failCountRef = useRef(0)
  const nextApiRetryAtRef = useRef<number | null>(null)
  const resumeAppliedRef = useRef(false)
  const resumeTargetSecondsRef = useRef<number | null>(null)
  const maxPlayedSecondsRef = useRef(0)
  // Latest ACTUAL player position (seconds) — the source of truth for the end
  // of a watched segment. Set from real onProgress events, never estimated.
  const latestPlayedRef = useRef(0)
  // Bumped whenever a seek starts a fresh segment. An in-flight save compares
  // this against the value it captured to decide whether it may advance the
  // anchor after its await (see saveProgress).
  const segmentGenRef = useRef(0)
  const hlsRef = useRef<Hls | null>(null)
  const seekHintTimeoutRef = useRef<number | null>(null)
  const timerSnapshotRef = useRef({ timer: 0, totalDuration: 0 })

  const { time: timer, startTimer, stopTimer, resetTimer, changeSpeed, setTime: setTimer } =
    useTimer(0)

  const effectiveLastWatchedPosition = initialAttendance?.lastWatchedPosition
  resumeTargetSecondsRef.current =
    typeof effectiveLastWatchedPosition === 'number' &&
    Number.isFinite(effectiveLastWatchedPosition) &&
    effectiveLastWatchedPosition > 0
      ? effectiveLastWatchedPosition
      : null

  useEffect(() => {
    setMergedAttendanceIntervals(initialAttendance?.mergedIntervals ?? [])
  }, [initialAttendance?.mergedIntervals])

  const saveProgress = useCallback(async () => {
    if (isUpdatingRef.current) return

    // Capture the watched segment from the player's ACTUAL position, and do it
    // synchronously BEFORE any await. The end is the real played position — not
    // a `start + elapsed-timer` estimate — so playback-rate changes, buffering
    // and background-tab throttling can't make it drift. Capturing before the
    // await means a seek/play that lands mid-request can't corrupt what we send.
    const segStart = startTimeRef.current
    const segEnd = Math.max(segStart, Math.round(latestPlayedRef.current))
    if (segEnd <= segStart) return

    const gen = segmentGenRef.current
    isUpdatingRef.current = true
    try {
      const result = await storeLectureVideoProgressViaApi({
        lectureId,
        totalDuration: Math.round(totalDuration),
        intervals: [{ start: segStart, end: segEnd }],
      })

      if (result.ok) {
        await router.invalidate()
        failCountRef.current = 0
        nextApiRetryAtRef.current = null
        // Advance the anchor to what we just saved — but ONLY if no seek reset
        // the segment while the request was in flight (generation unchanged).
        // This kills the "green bar runs ahead / skips watched chunks" bug: the
        // old code did `startTimeRef = endTimeRef` after the await
        // unconditionally, so a seek mid-save re-anchored the next segment to a
        // stale position, offsetting every interval that followed.
        if (segmentGenRef.current === gen) {
          startTimeRef.current = segEnd
          endTimeRef.current = segEnd
          resetTimer()
          if (isVideoPausedRef.current) stopTimer()
          else startTimer()
        }
      } else {
        failCountRef.current += 1
        nextApiRetryAtRef.current = nextVideoProgressRetryAt(
          failCountRef.current,
          timerSnapshotRef.current.timer,
        )
      }
    } finally {
      isUpdatingRef.current = false
    }
  }, [lectureId, resetTimer, router, startTimer, stopTimer, totalDuration])

  const updateIfNeeded = useCallback(
    (time: number, duration: number, force = false) => {
      if (
        shouldSaveVideoProgress({
          timer: time,
          totalDuration: duration,
          failCount: failCountRef.current,
          nextApiRetryAt: nextApiRetryAtRef.current,
          isUpdating: isUpdatingRef.current,
          force,
        })
      ) {
        void saveProgress()
      }
    },
    [saveProgress],
  )

  useEffect(() => {
    // `timer` (scaled watch-time) now only PACES saves; the interval end comes
    // from the real player position at save time (see saveProgress). It no
    // longer dead-reckons endTimeRef.
    updateIfNeeded(timer, totalDuration, false)
    timerSnapshotRef.current = { timer, totalDuration }
  }, [timer, totalDuration, updateIfNeeded])

  useEffect(() => {
    resumeAppliedRef.current = false
    const hls = hlsRef.current
    if (hls) {
      hls.destroy()
      hlsRef.current = null
    }
  }, [src])

  useEffect(() => {
    const resume = resumeTargetSecondsRef.current
    if (resume === null) return
    maxPlayedSecondsRef.current = Math.max(maxPlayedSecondsRef.current, resume)
    if (resumeAppliedRef.current || isHls) return

    const timeoutId = window.setTimeout(() => {
      applyResumeIfNeeded({
        videoRef,
        resumeSeconds: resume,
        resumeAppliedRef,
        onApplied: seconds => {
          setProgress(seconds)
          startTimeRef.current = seconds
          maxPlayedSecondsRef.current = Math.max(maxPlayedSecondsRef.current, seconds)
        },
      })
    }, 200)
    return () => window.clearTimeout(timeoutId)
  }, [effectiveLastWatchedPosition, isHls, videoRef])

  useEffect(() => {
    return () => {
      updateIfNeeded(timerSnapshotRef.current.timer, timerSnapshotRef.current.totalDuration, true)
    }
  }, [updateIfNeeded])

  useEffect(() => {
    return () => {
      if (seekHintTimeoutRef.current) clearTimeout(seekHintTimeoutRef.current)
    }
  }, [])

  const handleProgress = useCallback((progressData: OnProgressProps) => {
    let playedSeconds =
      typeof progressData.playedSeconds === 'number' &&
      Number.isFinite(progressData.playedSeconds)
        ? progressData.playedSeconds
        : 0

    const target = resumeTargetSecondsRef.current
    const pendingResume =
      target !== null && target > SEEK_ALIGNMENT_EPSILON && !resumeAppliedRef.current

    if (pendingResume && playedSeconds <= SEEK_ALIGNMENT_EPSILON) {
      playedSeconds = target
    }

    setProgress(playedSeconds)
    latestPlayedRef.current = playedSeconds
    maxPlayedSecondsRef.current = Math.max(maxPlayedSecondsRef.current, playedSeconds)
  }, [])

  const handleSeek = useCallback(
    (seekSeconds: number) => {
      if (!Number.isFinite(seekSeconds) || seekSeconds < 0) return

      const target = resumeTargetSecondsRef.current
      const isLikelyWarmupZero =
        seekSeconds <= SEEK_ALIGNMENT_EPSILON &&
        target !== null &&
        target > SEEK_ALIGNMENT_EPSILON &&
        !resumeAppliedRef.current

      if (!isLikelyWarmupZero) resumeAppliedRef.current = true

      // Close and save the segment watched up to the CURRENT real position
      // before jumping. saveProgress captures its segment synchronously, so
      // this runs against the pre-seek start/position.
      updateIfNeeded(timerSnapshotRef.current.timer, timerSnapshotRef.current.totalDuration, true)

      // Start a fresh segment at the seek target. Bumping the generation makes
      // any in-flight save skip its post-await anchor advance, so it cannot
      // re-anchor the next segment to the old (pre-seek) position.
      segmentGenRef.current += 1
      const rounded = Math.round(seekSeconds)
      startTimeRef.current = rounded
      endTimeRef.current = rounded
      latestPlayedRef.current = seekSeconds
      setTimer(0)
      setProgress(seekSeconds)
      maxPlayedSecondsRef.current = Math.max(maxPlayedSecondsRef.current, seekSeconds)
    },
    [setTimer, updateIfNeeded],
  )

  const handleVideoPlay = useCallback(() => {
    // Do NOT re-anchor startTimeRef here. The open segment is
    // [startTimeRef, latestPlayed]; resetting the start on every play would
    // drop an as-yet-unsaved span (e.g. after a failed save). Seeks are the
    // only thing that legitimately start a new segment (see handleSeek).
    setIsVideoPlaying(true)
    isVideoPausedRef.current = false
    startTimer()
  }, [startTimer])

  const handleVideoPause = useCallback(() => {
    setIsVideoPlaying(false)
    stopTimer()
    isVideoPausedRef.current = true
    updateIfNeeded(timerSnapshotRef.current.timer, timerSnapshotRef.current.totalDuration, true)
  }, [stopTimer, updateIfNeeded])

  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false)
    updateIfNeeded(timerSnapshotRef.current.timer, timerSnapshotRef.current.totalDuration, false)
  }, [updateIfNeeded])

  const handleBuffer = useCallback(() => {
    stopTimer()
    updateIfNeeded(timerSnapshotRef.current.timer, timerSnapshotRef.current.totalDuration, false)
  }, [stopTimer, updateIfNeeded])

  const handleBufferEnd = useCallback(() => {
    startTimer()
  }, [startTimer])

  const handleDuration = useCallback((duration: number) => {
    setTotalDuration(duration)
  }, [])

  const handlePlayBackRateChange = useCallback(
    (rate: number) => {
      setPlaybackRate(rate)
      changeSpeed(rate)
    },
    [changeSpeed],
  )

  const handleReady = useCallback(() => {
    const player = videoRef.current
    const videoEl = player
      ? (player.getInternalPlayer() as HTMLMediaElement | undefined)
      : undefined
    const useHlsJs = Boolean(isHls && videoEl && src && Hls.isSupported())

    if (useHlsJs && videoEl) {
      if (!hlsRef.current) {
        const hls = new Hls()
        hlsRef.current = hls
        hls.loadSource(src)
        hls.attachMedia(videoEl)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          applyResumeIfNeeded({
            videoRef,
            resumeSeconds: resumeTargetSecondsRef.current,
            resumeAppliedRef,
            onApplied: seconds => {
              setProgress(seconds)
              startTimeRef.current = seconds
              maxPlayedSecondsRef.current = Math.max(maxPlayedSecondsRef.current, seconds)
            },
          })
        })
      }
      setPlayerReadyVersion(version => version + 1)
      return
    }

    applyResumeIfNeeded({
      videoRef,
      resumeSeconds: resumeTargetSecondsRef.current,
      resumeAppliedRef,
      onApplied: seconds => {
        setProgress(seconds)
        startTimeRef.current = seconds
        maxPlayedSecondsRef.current = Math.max(maxPlayedSecondsRef.current, seconds)
      },
    })
    setPlayerReadyVersion(version => version + 1)
  }, [isHls, src, videoRef])

  const seekBySeconds = useCallback(
    (delta: number) => {
      resumeAppliedRef.current = true
      const player = videoRef.current as { getCurrentTime?: () => number } | null
      const currentTime =
        typeof player?.getCurrentTime === 'function'
          ? player.getCurrentTime()
          : progress
      const nextTime = Math.max((currentTime || 0) + delta, 0)
      seekPlayerToSeconds(videoRef, nextTime)
      if (delta !== 0) {
        setSeekHint(delta > 0 ? 'forward' : 'backward')
        if (seekHintTimeoutRef.current) clearTimeout(seekHintTimeoutRef.current)
        seekHintTimeoutRef.current = window.setTimeout(() => {
          setSeekHint(null)
          seekHintTimeoutRef.current = null
        }, 650)
      }
    },
    [progress, videoRef],
  )

  const toggleVideoPlayPause = useCallback(() => {
    const player = videoRef.current
    if (!player) return
    const internal = player.getInternalPlayer()
    if (
      typeof internal === 'object' &&
      'tagName' in internal &&
      (internal as HTMLVideoElement).tagName === 'VIDEO'
    ) {
      const video = internal as HTMLVideoElement
      if (video.paused) void video.play()
      else void video.pause()
    }
  }, [videoRef])

  return {
    progress,
    totalDuration,
    isVideoPlaying,
    playbackRate,
    playerReadyVersion,
    seekHint,
    mergedAttendanceIntervals,
    handleProgress,
    handleSeek,
    handleVideoPlay,
    handleVideoPause,
    handleVideoEnded,
    handleBuffer,
    handleBufferEnd,
    handleDuration,
    handlePlayBackRateChange,
    handleReady,
    seekBySeconds,
    toggleVideoPlayPause,
  }
}
