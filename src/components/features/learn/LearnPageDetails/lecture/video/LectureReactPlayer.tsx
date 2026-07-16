'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import ReactPlayer from 'react-player/lazy'

import { VideoAttendanceCustomControls } from './controls/VideoAttendanceCustomControls'
import { LECTURE_VIDEO_CHROME_CSS } from './controls/lectureVideoChrome.constants'
import { getHtmlVideoFromPlayer } from './controls/lectureVideoChrome.utils'
import { getLectureSplitChatOpenWidthCss } from '../constants/lectureSplitLayout'
import { useLectureSplitChatOptional } from '../hooks/LectureSplitChatContext'
import {
  enterElementFullscreen,
  exitAnyFullscreen,
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
import { LectureAiChatExperience } from '@/components/features/lecture-ai-chat/LectureAiChatExperience'
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

  useEffect(() => {
    const onWindowKey = (event: KeyboardEvent) => {
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
            isVideoPlaying={attendance.isVideoPlaying}
            onCenterPlay={attendance.toggleVideoPlayPause}
            seekHint={attendance.seekHint}
            videoAspectRatio={videoAspectRatio}
          />
          <LectureVideoCaptionOverlay
            segments={segments}
            progressSeconds={attendance.progress}
            visible={captionsOn && hasTranscript}
          />
          {attendance.qualityLevels.length > 0 ? (
            <select
              aria-label="Video quality"
              value={attendance.currentQuality}
              onChange={(event) =>
                attendance.changeQuality(Number(event.target.value))
              }
              className="absolute right-3 top-3 z-[55] cursor-pointer rounded-md border border-white/15 bg-black/60 py-1.5 pl-3 pr-2 text-sm font-medium text-white outline-none backdrop-blur-sm transition-colors hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <option value={-1}>Auto</option>
              {attendance.qualityLevels.map((level) => (
                <option key={level.index} value={level.index}>
                  {level.height}p
                </option>
              ))}
            </select>
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
        />
        {splitChat?.isOpen && isFullscreen ? (
          <div
            className="absolute inset-y-0 right-0 z-[55] flex min-h-0 flex-col border-l border-border bg-surface shadow-2xl"
            style={{ width: getLectureSplitChatOpenWidthCss() }}
          >
            <LectureAiChatExperience
              lectureId={lectureId}
              onCloseSidebar={splitChat.close}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
