'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import ReactPlayer from 'react-player/lazy'
import { CaretDown, Check } from '@phosphor-icons/react'

import { VideoAttendanceCustomControls } from './controls/VideoAttendanceCustomControls'
import { LECTURE_VIDEO_CHROME_CSS } from './controls/lectureVideoChrome.constants'
import { getHtmlVideoFromPlayer } from './controls/lectureVideoChrome.utils'
import { useLectureSplitChatOptional } from '../hooks/LectureSplitChatContext'
import {
  enterElementFullscreen,
  exitAnyFullscreen,
  FULLSCREEN_CHANGE_EVENTS,
  getFullscreenElement,
  isCoarsePointerDevice,
  supportsElementFullscreen,
  toggleLectureVideoFullscreen,
} from './hooks/lectureVideoFullscreen.utils'
import { seekPlayerToSeconds } from './hooks/lectureVideoResume'
import {
  shouldUseHlsJsForSrc,
  useLectureVideoAttendance,
} from './hooks/useLectureVideoAttendance'
import { useIsElementFullscreen } from './hooks/useLectureVideoFullscreen'
import { VideoPlaybackOverlays } from './VideoPlaybackOverlays'
import { LectureVideoCaptionOverlay } from './LectureVideoCaptionOverlay'
import { LectureVideoGestureLayer } from './LectureVideoGestureLayer'
import type { LectureChromePlayerRef } from './controls/lectureVideoChrome.utils'

import './lectureReactPlayer.css'

import type {
  LectureTranscriptSegment,
  LectureVideoAttendanceState,
} from '@/server/learn/lectureDetailTypes'
import { LectureFloatingChat } from '@/components/features/lecture-ai-chat/components/LectureFloatingChat'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'
import { cn } from '@/lib/utils'

type LectureReactPlayerProps = {
  lectureId: number
  src: string
  initialAttendance: LectureVideoAttendanceState | null
  transcriptSegments?: Array<LectureTranscriptSegment>
  className?: string
  /** Reports the intrinsic video aspect ratio (w/h) once metadata loads. */
  onVideoAspectRatioChange?: (ratio: number) => void
}

export function LectureReactPlayer({
  lectureId,
  src,
  initialAttendance,
  transcriptSegments,
  className,
  onVideoAspectRatioChange,
}: LectureReactPlayerProps) {
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<LectureChromePlayerRef>(null)
  const splitChat = useLectureSplitChatOptional()
  const isFullscreen = useIsElementFullscreen(fullscreenContainerRef)

  const segments = transcriptSegments ?? []
  const hasTranscript = segments.length > 0
  const [captionsOn, setCaptionsOn] = useState(false)
  // Intrinsic w/h ratio of the loaded video — lets overlays anchor to the
  // visible (object-fit: contain) frame instead of the wrapper edges.
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null)

  useEffect(() => {
    if (!hasTranscript) setCaptionsOn(false)
  }, [hasTranscript])

  const attendance = useLectureVideoAttendance({
    lectureId,
    src,
    videoRef,
    initialAttendance,
  })

  // Surface the real video dimensions so mobile can size the player to the
  // actual aspect ratio instead of a fixed viewport slice.
  useEffect(() => {
    const video = getHtmlVideoFromPlayer(videoRef)
    if (!video) return
    const report = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        const ratio = video.videoWidth / video.videoHeight
        setVideoAspectRatio(ratio)
        onVideoAspectRatioChange?.(ratio)
      }
    }
    report()
    video.addEventListener('loadedmetadata', report)
    // `resize` fires when an HLS rendition switch changes intrinsic size.
    video.addEventListener('resize', report)
    return () => {
      video.removeEventListener('loadedmetadata', report)
      video.removeEventListener('resize', report)
    }
  }, [attendance.playerReadyVersion, onVideoAspectRatioChange, videoRef])

  // YouTube-style rotate-to-fullscreen on touch devices that support element
  // fullscreen (Android). iPhone Safari has no element fullscreen; its native
  // fullscreen player (via the fullscreen button) handles rotation itself.
  const isPlayingRef = useRef(false)
  useEffect(() => {
    isPlayingRef.current = attendance.isVideoPlaying
  }, [attendance.isVideoPlaying])

  useEffect(() => {
    if (typeof window === 'undefined' || !isCoarsePointerDevice()) return
    const landscapeQuery = window.matchMedia('(orientation: landscape)')
    let exitTimer: number | null = null
    const clearExitTimer = () => {
      if (exitTimer !== null) {
        window.clearTimeout(exitTimer)
        exitTimer = null
      }
    }
    const onOrientationChange = () => {
      const container = fullscreenContainerRef.current
      if (!container || !supportsElementFullscreen(container)) return
      if (landscapeQuery.matches) {
        clearExitTimer()
        if (isPlayingRef.current && !getFullscreenElement()) {
          // No orientation lock here — the user must be able to rotate back.
          void enterElementFullscreen(container)
        }
      } else if (getFullscreenElement() === container) {
        // Debounced: a 180° landscape-to-landscape flip briefly reports
        // portrait mid-rotation. Exiting instantly would drop fullscreen and
        // the re-enter on the far side fails (no user gesture), stranding the
        // user on the inline view — so only exit if portrait sticks.
        clearExitTimer()
        exitTimer = window.setTimeout(() => {
          exitTimer = null
          if (!landscapeQuery.matches && getFullscreenElement() === container) {
            void exitAnyFullscreen()
          }
        }, 500)
      }
    }
    landscapeQuery.addEventListener('change', onOrientationChange)
    return () => {
      clearExitTimer()
      landscapeQuery.removeEventListener('change', onOrientationChange)
    }
  }, [])

  // Pause playback whenever this player instance's container is hidden
  // (display:none → observed size collapses to 0×0). The lecture page mounts
  // separate mobile/desktop player rows swapped at the `md` breakpoint, so
  // e.g. exiting fullscreen while the phone is still landscape hides the
  // playing mobile instance — without this its audio keeps running in the
  // background. A transient 0×0 during the enter-fullscreen swap is fine:
  // ResizeObserver coalesces to the final (visible) size.
  useEffect(() => {
    const container = fullscreenContainerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (entry.contentRect.width > 0 || entry.contentRect.height > 0) return
      const video = getHtmlVideoFromPlayer(videoRef)
      if (video && !video.paused) video.pause()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [videoRef])

  // Safety net for the same dual-instance layout: the ResizeObserver above
  // only catches a visible→hidden collapse, not a video that STARTS while its
  // container is already display:none (e.g. via a global shortcut or OS media
  // keys). If this hidden instance ever begins playing, pause it immediately —
  // its audio would otherwise run under the visible player's.
  useEffect(() => {
    const video = getHtmlVideoFromPlayer(videoRef)
    const container = fullscreenContainerRef.current
    if (!video || !container) return
    const onPlay = () => {
      if (container.offsetWidth === 0 && container.offsetHeight === 0) {
        video.pause()
      }
    }
    video.addEventListener('play', onPlay)
    return () => video.removeEventListener('play', onPlay)
  }, [attendance.playerReadyVersion, videoRef])

  // Fallback for touch devices where screen.orientation.lock() is rejected
  // (e.g. Android Chrome in a regular, non-installed tab): while fullscreen
  // and still physically portrait, CSS-rotate the container so a landscape
  // video fills the screen. Clears itself the moment the OS actually rotates.
  useEffect(() => {
    if (typeof window === 'undefined' || !isCoarsePointerDevice()) return
    const portraitQuery = window.matchMedia('(orientation: portrait)')
    const sync = () => {
      const container = fullscreenContainerRef.current
      if (!container) return
      const video = getHtmlVideoFromPlayer(videoRef)
      const isLandscapeVideo =
        !video || video.videoWidth === 0 || video.videoWidth >= video.videoHeight
      const shouldRotate =
        getFullscreenElement() === container &&
        portraitQuery.matches &&
        isLandscapeVideo
      container.classList.toggle('lecture-video-fs-rotate', shouldRotate)
    }
    sync()
    portraitQuery.addEventListener('change', sync)
    for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
      document.addEventListener(eventName, sync)
    }
    return () => {
      portraitQuery.removeEventListener('change', sync)
      for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
        document.removeEventListener(eventName, sync)
      }
      fullscreenContainerRef.current?.classList.remove(
        'lecture-video-fs-rotate',
      )
    }
  }, [])

  useEffect(() => {
    const onWindowKey = (event: KeyboardEvent) => {
      // TWO player instances are mounted at once (mobile/desktop rows swapped
      // via display:none at the md breakpoint) and each registers this window
      // listener. Only the VISIBLE instance may handle shortcuts — otherwise
      // Space also starts the hidden instance's video, whose audio still
      // plays (the "two voices in parallel" bug).
      const container = fullscreenContainerRef.current
      if (
        !container ||
        (container.offsetWidth === 0 && container.offsetHeight === 0)
      ) {
        return
      }
      const target = event.target as HTMLElement | null
      const tag = target ? target.tagName.toLowerCase() : undefined
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable
      ) {
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        event.stopPropagation()
        attendance.seekBySeconds(5)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        event.stopPropagation()
        attendance.seekBySeconds(-5)
      } else if (event.key === ' ' || event.code === 'Space') {
        if (tag === 'button' || tag === 'a') return
        if (target?.closest('[role="slider"]')) return
        event.preventDefault()
        event.stopPropagation()
        attendance.toggleVideoPlayPause()
      }
    }

    window.addEventListener('keydown', onWindowKey, { capture: true })
    return () =>
      window.removeEventListener('keydown', onWindowKey, { capture: true })
  }, [attendance.seekBySeconds, attendance.toggleVideoPlayPause])

  // Mirrors the controls' auto-hide chrome state so captions can lift above
  // the progress bar while the chrome is showing.
  const [controlsChromeVisible, setControlsChromeVisible] = useState(true)

  // Fade the player back in on every fullscreen enter/exit so the native
  // instant jump feels like a smooth transition.
  const prevFullscreenRef = useRef<boolean | null>(null)
  useEffect(() => {
    const wasFullscreen = prevFullscreenRef.current
    prevFullscreenRef.current = isFullscreen
    if (wasFullscreen === null || wasFullscreen === isFullscreen) return
    const element = fullscreenContainerRef.current
    if (!element) return
    element.classList.remove('lecture-video-fs-settling')
    // Force a reflow so re-adding the class restarts the animation even when
    // the user toggles fullscreen rapidly.
    void element.offsetWidth
    element.classList.add('lecture-video-fs-settling')
    const timeoutId = window.setTimeout(
      () => element.classList.remove('lecture-video-fs-settling'),
      350,
    )
    return () => window.clearTimeout(timeoutId)
  }, [isFullscreen])

  // Custom glass dropdown for the top-right quality shortcut (a native
  // <select> would open the OS-styled picker, breaking the glass chrome).
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false)
  const qualityMenuRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!qualityMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const element = qualityMenuRef.current
      if (element && !element.contains(event.target as Node)) {
        setQualityMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', onPointerDown, true)
  }, [qualityMenuOpen])

  return (
    <div
      ref={fullscreenContainerRef}
      className={cn(
        'lecture-react-player lecture-video-fs-root group relative flex h-full min-h-0 w-full flex-1 flex-col bg-black outline-none',
        className,
      )}
    >
      <style>{LECTURE_VIDEO_CHROME_CSS}</style>
      <div className="lecture-video-fs-video relative flex h-full min-h-0 w-full flex-1 flex-col">
        <div
          className="react-player-page relative h-full min-h-0 w-full flex-1"
          style={{ overflow: 'visible' }}
        >
          <ReactPlayer
            ref={videoRef}
            className="lecture-react-player__rp"
            url={src}
            width="100%"
            height="100%"
            controls={false}
            playsinline
            progressInterval={200}
            playbackRate={attendance.playbackRate}
            onReady={attendance.handleReady}
            onProgress={attendance.handleProgress}
            onStart={attendance.handleVideoPlay}
            onPlay={attendance.handleVideoPlay}
            onPause={attendance.handleVideoPause}
            onBuffer={attendance.handleBuffer}
            onBufferEnd={attendance.handleBufferEnd}
            onDuration={attendance.handleDuration}
            onPlaybackRateChange={attendance.handlePlayBackRateChange}
            onEnded={attendance.handleVideoEnded}
            onSeek={attendance.handleSeek}
            onContextMenu={(event: MouseEvent) => event.preventDefault()}
            config={{
              file: {
                // Never force hls.js on iOS — iPhone must use Safari's native
                // HLS (react-player skips hls.js for IS_IOS unless forced).
                forceHLS: shouldUseHlsJsForSrc(src),
                attributes: {
                  playsInline: true,
                  controlsList: 'nodownload',
                },
              },
            }}
            style={{ background: '#000', display: 'block' }}
          />
          <LectureVideoGestureLayer
            onTogglePlay={attendance.toggleVideoPlayPause}
            onToggleFullscreen={() =>
              toggleLectureVideoFullscreen(
                fullscreenContainerRef.current,
                getHtmlVideoFromPlayer(videoRef),
              )
            }
            onSeekBySeconds={attendance.seekBySeconds}
          />
          <VideoPlaybackOverlays
            seekHint={attendance.seekHint}
            videoAspectRatio={videoAspectRatio}
          />
          <LectureVideoCaptionOverlay
            segments={segments}
            progressSeconds={attendance.progress}
            visible={captionsOn && hasTranscript}
            liftForControls={controlsChromeVisible}
          />
          {attendance.qualityLevels.length > 0 ? (
            // Fully custom glass dropdown (no native <select> — the OS picker
            // would break the glass chrome). A <span>, NOT a <div>:
            // lectureReactPlayer.css force-stretches `.react-player-page > div`
            // to 100%×100%, which would turn this into a click-swallowing
            // overlay.
            <span
              ref={qualityMenuRef}
              className="absolute right-3 top-3 z-[55] block"
            >
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={qualityMenuOpen}
                aria-label="Video quality"
                onClick={() => setQualityMenuOpen((open) => !open)}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/10 py-2 pl-4 pr-3.5 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] outline-none backdrop-blur-xl transition duration-200 hover:border-white/30 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/50"
              >
                {attendance.currentQuality === -1
                  ? 'Auto'
                  : `${
                      attendance.qualityLevels.find(
                        (level) => level.index === attendance.currentQuality,
                      )?.height ?? '?'
                    }p`}
                <CaretDown
                  className={`h-4 w-4 shrink-0 text-white/80 transition-transform duration-200 ${
                    qualityMenuOpen ? 'rotate-180' : ''
                  }`}
                  weight="bold"
                  aria-hidden
                />
              </button>
              {qualityMenuOpen ? (
                <div
                  role="listbox"
                  aria-label="Video quality"
                  className="absolute right-0 top-full z-[60] mt-2 min-w-[7.5rem] overflow-hidden rounded-2xl border border-white/15 bg-black/60 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150"
                >
                  {[
                    { index: -1, label: 'Auto' },
                    ...attendance.qualityLevels.map((level) => ({
                      index: level.index,
                      label: `${level.height}p`,
                    })),
                  ].map((option) => {
                    const selected = option.index === attendance.currentQuality
                    return (
                      <button
                        key={option.index}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          attendance.changeQuality(option.index)
                          setQualityMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white transition duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      >
                        <Check
                          className={`h-4 w-4 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`}
                          weight="bold"
                        />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </span>
          ) : null}
        </div>
        <VideoAttendanceCustomControls
          videoRef={videoRef}
          totalDuration={attendance.totalDuration}
          playedSeconds={attendance.progress}
          mergedIntervals={attendance.mergedAttendanceIntervals}
          isPlaying={attendance.isVideoPlaying}
          fullscreenContainerRef={fullscreenContainerRef}
          onSeekBySeconds={attendance.seekBySeconds}
          onSeekToSeconds={(seconds) => {
            attendance.handleSeek(seconds)
            seekPlayerToSeconds(videoRef, seconds)
          }}
          playerReadyVersion={attendance.playerReadyVersion}
          playbackRate={attendance.playbackRate}
          onPlaybackRateChange={attendance.handlePlayBackRateChange}
          qualityLevels={attendance.qualityLevels}
          currentQuality={attendance.currentQuality}
          onQualityChange={attendance.changeQuality}
          transcriptAvailable={hasTranscript}
          captionsOn={captionsOn}
          onCaptionsToggle={() => setCaptionsOn((value) => !value)}
          onOpenAiChat={
            splitChat
              ? () => {
                  pushLearnEvent('l_learn_lecture_ask_ai_open', { lectureId })
                  splitChat.open()
                }
              : undefined
          }
          onChromeVisibleChange={setControlsChromeVisible}
        />
        {/* While the video is in browser fullscreen, a body-portaled page-level
            launcher can't render over the fullscreen element, so the floating
            chat lives inside the fullscreen root here (bottom-right). */}
        {splitChat && isFullscreen ? (
          <LectureFloatingChat
            lectureId={lectureId}
            state={splitChat}
            variant="contained"
            showLauncher={false}
          />
        ) : null}
      </div>
    </div>
  )
}
