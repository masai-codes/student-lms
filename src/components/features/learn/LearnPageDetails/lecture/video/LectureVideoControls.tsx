'use client'

import { LectureTheaterModeToggle } from './LectureTheaterModeToggle'
import { formatVideoTime } from './formatVideoTime'
import {
  YoutubeFullscreenIcon,
  YoutubePauseIcon,
  YoutubePlayIcon,
  YoutubeVolumeHighIcon,
  YoutubeVolumeMutedIcon,
} from './youtubePlayerIcons'

import { cn } from '@/lib/utils'

type LectureVideoControlsProps = {
  playing: boolean
  played: number
  playedSeconds: number
  duration: number
  volume: number
  muted: boolean
  isTheaterMode: boolean
  visible: boolean
  onPlayPause: () => void
  onSeek: (fraction: number) => void
  onSeekStart: () => void
  onSeekEnd: () => void
  onVolumeChange: (volume: number) => void
  onMuteToggle: () => void
  onTheaterModeToggle?: () => void
  onFullscreen: () => void
}

export function LectureVideoControls({
  playing,
  played,
  playedSeconds,
  duration,
  volume,
  muted,
  isTheaterMode,
  visible,
  onPlayPause,
  onSeek,
  onSeekStart,
  onSeekEnd,
  onVolumeChange,
  onMuteToggle,
  onTheaterModeToggle,
  onFullscreen,
}: LectureVideoControlsProps) {
  return (
    <div
      className={cn(
        'lecture-video-controls',
        visible && 'lecture-video-controls--visible',
      )}
      onClick={event => event.stopPropagation()}
    >
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={played}
        aria-label="Seek"
        className="lecture-video-controls__progress"
        onChange={event => onSeek(Number(event.target.value))}
        onMouseDown={onSeekStart}
        onMouseUp={onSeekEnd}
        onTouchStart={onSeekStart}
        onTouchEnd={onSeekEnd}
      />

      <div className="lecture-video-controls__row">
        <div className="lecture-video-controls__left">
          <button
            type="button"
            onClick={onPlayPause}
            aria-label={playing ? 'Pause' : 'Play'}
            className="lecture-video-controls__btn"
          >
            {playing ? <YoutubePauseIcon /> : <YoutubePlayIcon />}
          </button>

          <button
            type="button"
            onClick={onMuteToggle}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="lecture-video-controls__btn"
          >
            {muted || volume === 0 ? (
              <YoutubeVolumeMutedIcon />
            ) : (
              <YoutubeVolumeHighIcon />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            aria-label="Volume"
            className="lecture-video-controls__volume"
            onChange={event => onVolumeChange(Number(event.target.value))}
          />
        </div>

        <div className="lecture-video-controls__right">
          <span className="lecture-video-controls__time">
            {formatVideoTime(playedSeconds)} / {formatVideoTime(duration)}
          </span>

          {onTheaterModeToggle ? (
            <LectureTheaterModeToggle
              isTheaterMode={isTheaterMode}
              onToggle={onTheaterModeToggle}
            />
          ) : null}

          <button
            type="button"
            onClick={onFullscreen}
            aria-label="Fullscreen"
            className="lecture-video-controls__btn"
          >
            <YoutubeFullscreenIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
