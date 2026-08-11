'use client'

import { useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

import { SEEK_ALIGNMENT_EPSILON } from '../controls/lectureVideoChrome.constants'
import { isIosLikeDevice } from './lectureVideoFullscreen.utils'
import {
  applyResumeIfNeeded,
  RESUME_END_GUARD_SECONDS,
  seekPlayerToSeconds,
} from './lectureVideoResume'
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

/**
 * hls.js only where MSE genuinely works (desktop / Android) — it powers the
 * quality picker. On iPhone/iPad we MUST use Safari's native HLS: forcing
 * hls.js there (MSE-less or ManagedMediaSource-flaky) breaks playback
 * entirely, which is why lectures played in the old LMS but not here.
 */
export function shouldUseHlsJsForSrc(src: string): boolean {
  return (
    isHlsUrl(src) &&
    typeof window !== 'undefined' &&
    !isIosLikeDevice() &&
    Hls.isSupported()
  )
}

/**
 * play() returns a promise that can reject on mobile Safari (aborted load,
 * transient network error). Recover by reloading the element once when it has
 * no usable data, so the user's tap still starts playback.
 */
export function playVideoWithRecovery(video: HTMLVideoElement): void {
  const playResult: Promise<void> | undefined = video.play()
  void playResult?.catch(() => {
    if (video.error || video.readyState === HTMLMediaElement.HAVE_NOTHING) {
      try {
        video.load()
        const retry: Promise<void> | undefined = video.play()
        void retry?.catch(() => {})
      } catch {
        /* leave paused; user can retry */
      }
    }
  })
}

/** A selectable HLS rendition, surfaced to the quality picker. */
export type LectureVideoQualityLevel = {
  /** Index into `hls.levels`; pass to `changeQuality`. */
  index: number
  height: number
  bitrate: number
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
  const [qualityLevels, setQualityLevels] = useState<
    LectureVideoQualityLevel[]
  >([])
  // Selected HLS rendition. -1 = Auto (hls.js adaptive bitrate).
  const [currentQuality, setCurrentQuality] = useState(-1)
  const [playerReadyVersion, setPlayerReadyVersion] = useState(0)
  const [seekHint, setSeekHint] = useState<'forward' | 'backward' | null>(null)
  // Bumped on every user seek. Lets consumers distinguish a deliberate scrub
  // from natural playback (which advances `progress` smoothly).
  const [seekNonce, setSeekNonce] = useState(0)
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

  const {
    time: timer,
    startTimer,
    stopTimer,
    resetTimer,
    changeSpeed,
    setTime: setTimer,
  } = useTimer(0)

  const effectiveLastWatchedPosition = initialAttendance?.lastWatchedPosition
  // A fully-watched video must NOT resume at its final seconds: the first
  // play would instantly hit `ended` and pause again ("plays then stops by
  // itself after reload"). Restart from the beginning instead.
  const savedTotalDuration = initialAttendance?.totalDuration
  const resumeIsNearEnd =
    typeof effectiveLastWatchedPosition === 'number' &&
    typeof savedTotalDuration === 'number' &&
    savedTotalDuration > 0 &&
    effectiveLastWatchedPosition >=
      savedTotalDuration - RESUME_END_GUARD_SECONDS
  resumeTargetSecondsRef.current =
    typeof effectiveLastWatchedPosition === 'number' &&
    Number.isFinite(effectiveLastWatchedPosition) &&
    effectiveLastWatchedPosition > 0 &&
    !resumeIsNearEnd
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
    setQualityLevels([])
    setCurrentQuality(-1)
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
        // The resume target comes from the SSR payload, so this timeout
        // almost always fires before an MP4 reaches canplay/onReady. Without
        // requireReady the pre-ready seekTo is a no-op that still latched
        // resumeAppliedRef, so handleReady never re-seeked → MP4s resumed at
        // 0. Not-ready here just defers to the onReady call in handleReady.
        requireReady: true,
        onApplied: (seconds) => {
          setProgress(seconds)
          startTimeRef.current = seconds
          maxPlayedSecondsRef.current = Math.max(
            maxPlayedSecondsRef.current,
            seconds,
          )
        },
      })
    }, 200)
    return () => window.clearTimeout(timeoutId)
  }, [effectiveLastWatchedPosition, isHls, videoRef])

  // Flush a final save when the player unmounts. Keep the action in a ref and
  // give the effect empty deps, so it fires ONLY on real unmount. Depending on
  // `updateIfNeeded` here would re-run the cleanup on every render (its identity
  // changes each render), turning this into a forced save several times a
  // second — the cause of the per-second POST + lecture-detail refetch storm.
  const flushOnExitRef = useRef<() => void>(() => {})
  flushOnExitRef.current = () => {
    updateIfNeeded(
      timerSnapshotRef.current.timer,
      timerSnapshotRef.current.totalDuration,
      true,
    )
  }
  useEffect(() => {
    return () => {
      flushOnExitRef.current()
    }
  }, [])

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
      target !== null &&
      target > SEEK_ALIGNMENT_EPSILON &&
      !resumeAppliedRef.current

    if (pendingResume && playedSeconds <= SEEK_ALIGNMENT_EPSILON) {
      playedSeconds = target
    }

    setProgress(playedSeconds)
    latestPlayedRef.current = playedSeconds
    maxPlayedSecondsRef.current = Math.max(
      maxPlayedSecondsRef.current,
      playedSeconds,
    )
  }, [])

  const handleSeek = useCallback(
    (seekSeconds: number) => {
      if (!Number.isFinite(seekSeconds) || seekSeconds < 0) return

      setSeekNonce((nonce) => nonce + 1)

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
      updateIfNeeded(
        timerSnapshotRef.current.timer,
        timerSnapshotRef.current.totalDuration,
        true,
      )

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
      maxPlayedSecondsRef.current = Math.max(
        maxPlayedSecondsRef.current,
        seekSeconds,
      )
    },
    [setTimer, updateIfNeeded],
  )

  // Persist an explicit `[start, end]` range as watched, independent of the
  // real-playback segment tracked by `startTimeRef`/`latestPlayedRef` above.
  // Used when a quiz/poll's "Continue" skips the player past its window: the
  // skipped range never becomes a real played segment (see `handleSeek`), so
  // without this it would silently count against attendance. Reuses the same
  // `video-progress` endpoint / `mergeIntervals` merge the normal save path
  // uses, so it composes correctly with whatever's already stored.
  const markIntervalWatched = useCallback(
    (start: number, end: number) => {
      const s = Math.round(start)
      const e = Math.round(end)
      if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return
      void (async () => {
        const result = await storeLectureVideoProgressViaApi({
          lectureId,
          totalDuration: Math.round(totalDuration),
          intervals: [{ start: s, end: e }],
        })
        if (result.ok) await router.invalidate()
      })()
    },
    [lectureId, totalDuration, router],
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
    updateIfNeeded(
      timerSnapshotRef.current.timer,
      timerSnapshotRef.current.totalDuration,
      true,
    )
  }, [stopTimer, updateIfNeeded])

  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false)
    updateIfNeeded(
      timerSnapshotRef.current.timer,
      timerSnapshotRef.current.totalDuration,
      false,
    )
  }, [updateIfNeeded])

  const handleBuffer = useCallback(() => {
    stopTimer()
    updateIfNeeded(
      timerSnapshotRef.current.timer,
      timerSnapshotRef.current.totalDuration,
      false,
    )
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

  const changeQuality = useCallback((levelIndex: number) => {
    const hls = hlsRef.current
    if (!hls) return
    // -1 hands control back to hls.js adaptive bitrate (Auto).
    hls.currentLevel = levelIndex
    setCurrentQuality(levelIndex)
  }, [])

  const handleReady = useCallback(() => {
    const player = videoRef.current
    const videoEl = player
      ? (player.getInternalPlayer() as HTMLMediaElement | undefined)
      : undefined
    const useHlsJs = Boolean(videoEl && src && shouldUseHlsJsForSrc(src))

    if (useHlsJs && videoEl) {
      if (!hlsRef.current) {
        const hls = new Hls()
        hlsRef.current = hls
        hls.loadSource(src)
        hls.attachMedia(videoEl)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setQualityLevels(
            hls.levels.map((level, index) => ({
              index,
              height: level.height,
              bitrate: level.bitrate,
            })),
          )
          setCurrentQuality(hls.autoLevelEnabled ? -1 : hls.currentLevel)
          applyResumeIfNeeded({
            videoRef,
            resumeSeconds: resumeTargetSecondsRef.current,
            resumeAppliedRef,
            onApplied: (seconds) => {
              setProgress(seconds)
              startTimeRef.current = seconds
              maxPlayedSecondsRef.current = Math.max(
                maxPlayedSecondsRef.current,
                seconds,
              )
            },
          })
        })
        // Keep the label in sync when ABR (Auto) switches rendition on its own.
        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          if (hls.autoLevelEnabled) setCurrentQuality(-1)
          else setCurrentQuality(data.level)
        })
      }
      setPlayerReadyVersion((version) => version + 1)
      return
    }

    applyResumeIfNeeded({
      videoRef,
      resumeSeconds: resumeTargetSecondsRef.current,
      resumeAppliedRef,
      onApplied: (seconds) => {
        setProgress(seconds)
        startTimeRef.current = seconds
        maxPlayedSecondsRef.current = Math.max(
          maxPlayedSecondsRef.current,
          seconds,
        )
      },
    })
    setPlayerReadyVersion((version) => version + 1)
  }, [isHls, src, videoRef])

  const seekBySeconds = useCallback(
    (delta: number) => {
      resumeAppliedRef.current = true
      const player = videoRef.current as {
        getCurrentTime?: () => number
      } | null
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
      if (video.paused) playVideoWithRecovery(video)
      else void video.pause()
    }
  }, [videoRef])

  return {
    progress,
    totalDuration,
    isVideoPlaying,
    playbackRate,
    qualityLevels,
    currentQuality,
    changeQuality,
    playerReadyVersion,
    seekHint,
    seekNonce,
    mergedAttendanceIntervals,
    handleProgress,
    handleSeek,
    markIntervalWatched,
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
