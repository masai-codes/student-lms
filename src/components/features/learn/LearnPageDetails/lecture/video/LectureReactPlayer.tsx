'use client'

import { useEffect, useRef, type MouseEvent } from 'react'
import ReactPlayer from 'react-player/lazy'

import { VideoAttendanceCustomControls } from './controls/VideoAttendanceCustomControls'
import { LECTURE_VIDEO_CHROME_CSS } from './controls/lectureVideoChrome.constants'
import { seekPlayerToSeconds } from './hooks/lectureVideoResume'
import { useLectureVideoAttendance } from './hooks/useLectureVideoAttendance'
import { VideoPlaybackOverlays } from './VideoPlaybackOverlays'
import type { LectureChromePlayerRef } from './controls/lectureVideoChrome.utils'

import './lectureReactPlayer.css'

import type { LectureVideoAttendanceState } from '@/server/learn/lectureDetailTypes'
import { cn } from '@/lib/utils'

type LectureReactPlayerProps = {
  lectureId: number
  src: string
  initialAttendance: LectureVideoAttendanceState | null
  className?: string
  isTheaterMode?: boolean
  onTheaterModeToggle?: () => void
}

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8')
}

export function LectureReactPlayer({
  lectureId,
  src,
  initialAttendance,
  className,
  isTheaterMode = false,
  onTheaterModeToggle,
}: LectureReactPlayerProps) {
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<LectureChromePlayerRef>(null)

  const attendance = useLectureVideoAttendance({
    lectureId,
    src,
    videoRef,
    initialAttendance,
  })

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
    return () => window.removeEventListener('keydown', onWindowKey, { capture: true })
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
                forceHLS: isHlsUrl(src),
                attributes: {
                  playsInline: true,
                  controlsList: 'nodownload',
                  onClick: attendance.toggleVideoPlayPause,
                },
              },
            }}
            style={{ background: '#000', display: 'block' }}
          />
          <VideoPlaybackOverlays
            isVideoPlaying={attendance.isVideoPlaying}
            onCenterPlay={attendance.toggleVideoPlayPause}
            seekHint={attendance.seekHint}
          />
        </div>
        <VideoAttendanceCustomControls
          videoRef={videoRef}
          totalDuration={attendance.totalDuration}
          playedSeconds={attendance.progress}
          mergedIntervals={attendance.mergedAttendanceIntervals}
          isPlaying={attendance.isVideoPlaying}
          fullscreenContainerRef={fullscreenContainerRef}
          onSeekBySeconds={attendance.seekBySeconds}
          onSeekToSeconds={seconds => {
            attendance.handleSeek(seconds)
            seekPlayerToSeconds(videoRef, seconds)
          }}
          playerReadyVersion={attendance.playerReadyVersion}
          playbackRate={attendance.playbackRate}
          onPlaybackRateChange={attendance.handlePlayBackRateChange}
          isTheaterMode={isTheaterMode}
          onTheaterModeToggle={onTheaterModeToggle}
        />
      </div>
    </div>
  )
}
