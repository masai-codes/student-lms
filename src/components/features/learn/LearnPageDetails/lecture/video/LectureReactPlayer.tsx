'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import ReactPlayer from 'react-player/lazy'

import { VideoAttendanceCustomControls } from './controls/VideoAttendanceCustomControls'
import { LECTURE_VIDEO_CHROME_CSS } from './controls/lectureVideoChrome.constants'
import { getLectureSplitChatOpenWidthCss } from '../constants/lectureSplitLayout'
import { useLectureSplitChatOptional } from '../hooks/LectureSplitChatContext'
import { seekPlayerToSeconds } from './hooks/lectureVideoResume'
import { useLectureVideoAttendance } from './hooks/useLectureVideoAttendance'
import { useIsElementFullscreen } from './hooks/useLectureVideoFullscreen'
import { VideoPlaybackOverlays } from './VideoPlaybackOverlays'
import { LectureVideoCaptionOverlay } from './LectureVideoCaptionOverlay'
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
}

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8')
}

export function LectureReactPlayer({
  lectureId,
  src,
  initialAttendance,
  transcriptSegments,
  className,
}: LectureReactPlayerProps) {
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<LectureChromePlayerRef>(null)
  const splitChat = useLectureSplitChatOptional()
  const isFullscreen = useIsElementFullscreen(fullscreenContainerRef)

  const segments = transcriptSegments ?? []
  const hasTranscript = segments.length > 0
  const [captionsOn, setCaptionsOn] = useState(false)

  useEffect(() => {
    if (!hasTranscript) setCaptionsOn(false)
  }, [hasTranscript])

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
