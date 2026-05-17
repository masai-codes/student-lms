'use client'

import { useCallback, useRef, useState } from 'react'
import ReactPlayer from 'react-player/lazy'
import type { OnProgressProps } from 'react-player/base'

import { LectureVideoControls } from './LectureVideoControls'

import './lectureReactPlayer.css'

import { cn } from '@/lib/utils'

type LectureReactPlayerProps = {
  src: string
  className?: string
  isTheaterMode?: boolean
  onTheaterModeToggle?: () => void
}

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8')
}

export function LectureReactPlayer({
  src,
  className,
  isTheaterMode = false,
  onTheaterModeToggle,
}: LectureReactPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<ReactPlayer>(null)
  const seekingRef = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [played, setPlayed] = useState(0)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(false)

  const handleProgress = useCallback((state: OnProgressProps) => {
    if (seekingRef.current) return
    setPlayed(state.played)
    setPlayedSeconds(state.playedSeconds)
  }, [])

  const handleSeek = useCallback((fraction: number) => {
    setPlayed(fraction)
    playerRef.current?.seekTo(fraction)
  }, [])

  const handleSeekStart = useCallback(() => {
    seekingRef.current = true
  }, [])

  const handleSeekEnd = useCallback(() => {
    seekingRef.current = false
  }, [])

  const handleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await el.requestFullscreen()
      }
    } catch {
      // Fullscreen may be blocked by the browser.
    }
  }, [])

  const showControls = controlsVisible || !playing

  return (
    <div
      ref={containerRef}
      className={cn(
        'lecture-react-player group relative flex h-full min-h-0 w-full flex-1 flex-col bg-black',
        className,
      )}
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => setControlsVisible(false)}
    >
      <div
        className="lecture-react-player__stage"
        onClick={() => setPlaying(current => !current)}
        onDoubleClick={handleFullscreen}
      >
        <ReactPlayer
          ref={playerRef}
          className="lecture-react-player__rp"
          url={src}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          controls={false}
          playsinline
          progressInterval={200}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onDuration={setDuration}
          onProgress={handleProgress}
          config={{
            file: {
              forceHLS: isHlsUrl(src),
              attributes: {
                playsInline: true,
                controlsList: 'nodownload',
                disablePictureInPicture: false,
              },
            },
          }}
          style={{ background: '#000' }}
        />
      </div>

      <LectureVideoControls
        playing={playing}
        played={played}
        playedSeconds={playedSeconds}
        duration={duration}
        volume={volume}
        muted={muted}
        isTheaterMode={isTheaterMode}
        visible={showControls}
        onPlayPause={() => setPlaying(current => !current)}
        onSeek={handleSeek}
        onSeekStart={handleSeekStart}
        onSeekEnd={handleSeekEnd}
        onVolumeChange={nextVolume => {
          setVolume(nextVolume)
          if (nextVolume > 0) setMuted(false)
        }}
        onMuteToggle={() => setMuted(current => !current)}
        onTheaterModeToggle={onTheaterModeToggle}
        onFullscreen={handleFullscreen}
      />
    </div>
  )
}
