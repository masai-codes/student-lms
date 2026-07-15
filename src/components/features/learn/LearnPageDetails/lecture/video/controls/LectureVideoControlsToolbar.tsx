'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ClosedCaptioning,
  CornersIn,
  CornersOut,
  DotsThreeOutlineVertical,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
} from '@phosphor-icons/react'

import {
  LECTURE_VIDEO_OVERFLOW_VOLUME_CSS,
  PLAYBACK_RATE_OPTIONS,
} from './lectureVideoChrome.constants'
import {
  asPromise,
  formatVideoClock,
  getHtmlVideoFromPlayer,
  getVimeoLikeInternal,
  playbackRateLabel,
} from './lectureVideoChrome.utils'
import { LectureVideoAskAiPill } from './LectureVideoAskAiPill'
import type { LectureChromePlayerRef } from './lectureVideoChrome.utils'
import type { LectureVideoQualityLevel } from '../hooks/useLectureVideoAttendance'
import { useLectureSplitChatOptional } from '../../hooks/LectureSplitChatContext'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'

type LectureVideoControlsToolbarProps = {
  videoRef: React.MutableRefObject<LectureChromePlayerRef>
  playerReadyVersion: number
  totalDuration: number
  displaySeconds: number
  isPlaying: boolean
  playbackRate: number
  onPlaybackRateChange: (rate: number) => void
  qualityLevels: Array<LectureVideoQualityLevel>
  currentQuality: number
  onQualityChange: (levelIndex: number) => void
  fullscreenContainerRef: React.RefObject<HTMLDivElement | null>
  onActivity: () => void
  /** Whether AI transcript segments exist to power on-video captions. */
  transcriptAvailable: boolean
  captionsOn: boolean
  onCaptionsToggle: () => void
  /** Whether the auto-hiding control chrome is currently visible. */
  chromeVisible: boolean
  /** Notifies the parent when the overflow menu opens/closes so it can pause auto-hide. */
  onMenuOpenChange?: (open: boolean) => void
}

export function LectureVideoControlsToolbar({
  videoRef,
  playerReadyVersion,
  totalDuration,
  displaySeconds,
  isPlaying,
  playbackRate,
  onPlaybackRateChange,
  qualityLevels,
  currentQuality,
  onQualityChange,
  fullscreenContainerRef,
  onActivity,
  transcriptAvailable,
  captionsOn,
  onCaptionsToggle,
  chromeVisible,
  onMenuOpenChange,
}: LectureVideoControlsToolbarProps) {
  const splitChat = useLectureSplitChatOptional()
  const overflowMenuRef = useRef<HTMLDivElement>(null)
  const [volumeUi, setVolumeUi] = useState(1)
  const [mutedUi, setMutedUi] = useState(false)
  const [volumeUiSupported, setVolumeUiSupported] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false)

  const numeratorLongFmt =
    totalDuration >= 3600 || (totalDuration <= 0 && displaySeconds >= 3600)
  const denominatorLabel =
    totalDuration > 0
      ? formatVideoClock(totalDuration, totalDuration >= 3600)
      : '--:--'

  useEffect(() => {
    const onFullscreenChange = () => {
      const element = fullscreenContainerRef.current
      setIsFullscreen(
        Boolean(element && document.fullscreenElement === element),
      )
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    onFullscreenChange()
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [fullscreenContainerRef])

  useEffect(() => {
    const video = getHtmlVideoFromPlayer(videoRef)
    if (video) {
      setVolumeUiSupported(true)
      const sync = () => {
        setVolumeUi(video.volume)
        setMutedUi(video.muted)
      }
      sync()
      video.addEventListener('volumechange', sync)
      return () => video.removeEventListener('volumechange', sync)
    }

    const vimeo = getVimeoLikeInternal(videoRef)
    if (vimeo && vimeo.getVolume && vimeo.getMuted) {
      setVolumeUiSupported(Boolean(vimeo.setVolume && vimeo.setMuted))
      const pull = () => {
        if (!vimeo.getVolume || !vimeo.getMuted) return
        void Promise.all([
          asPromise(vimeo.getVolume()),
          asPromise(vimeo.getMuted()),
        ]).then(([volume, muted]) => {
          setVolumeUi(
            typeof volume === 'number' && Number.isFinite(volume) ? volume : 1,
          )
          setMutedUi(Boolean(muted))
        })
      }
      pull()
      if (typeof vimeo.on === 'function') {
        vimeo.on('volumechange', pull)
        return () => vimeo.off?.('volumechange', pull)
      }
    }

    setVolumeUiSupported(false)
    return undefined
  }, [videoRef, playerReadyVersion])

  // Keep the parent in sync so it can pause the chrome auto-hide while the
  // menu is open (otherwise the toolbar hides and an open native <select>
  // dropdown is left floating on screen).
  useEffect(() => {
    onMenuOpenChange?.(overflowMenuOpen)
  }, [overflowMenuOpen, onMenuOpenChange])

  // Safety net: if the chrome hides for any reason while the menu is open,
  // close the menu too. Unmounting the popover dismisses any open native
  // <select> (quality / playback speed) dropdown along with it.
  useEffect(() => {
    if (!chromeVisible && overflowMenuOpen) {
      setOverflowMenuOpen(false)
    }
  }, [chromeVisible, overflowMenuOpen])

  useEffect(() => {
    if (!overflowMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const element = overflowMenuRef.current
      if (element && !element.contains(event.target as Node)) {
        setOverflowMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', onPointerDown, true)
  }, [overflowMenuOpen])

  const togglePlay = () => {
    onActivity()
    const video = getHtmlVideoFromPlayer(videoRef)
    if (video) {
      if (video.paused) void video.play()
      else void video.pause()
      return
    }
    const vimeo = getVimeoLikeInternal(videoRef)
    if (vimeo?.getPaused) {
      void asPromise(vimeo.getPaused()).then((paused) => {
        if (paused) void vimeo.play?.()
        else void vimeo.pause?.()
      })
    }
  }

  const toggleMute = () => {
    onActivity()
    const video = getHtmlVideoFromPlayer(videoRef)
    if (video) {
      video.muted = !video.muted
      setMutedUi(video.muted)
      return
    }
    const vimeo = getVimeoLikeInternal(videoRef)
    if (vimeo?.getMuted && vimeo.setMuted) {
      void asPromise(vimeo.getMuted()).then((muted) => {
        void vimeo.setMuted?.(!muted)
        setMutedUi(!muted)
      })
    }
  }

  const onVolumeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    onActivity()
    const next = parseFloat(event.target.value)
    const video = getHtmlVideoFromPlayer(videoRef)
    if (video) {
      video.volume = next
      video.muted = next === 0
      setVolumeUi(video.volume)
      setMutedUi(video.muted)
      return
    }
    const vimeo = getVimeoLikeInternal(videoRef)
    if (vimeo?.setVolume) {
      void vimeo.setVolume(next)
      if (vimeo.setMuted) void vimeo.setMuted(next === 0)
      setVolumeUi(next)
      setMutedUi(next === 0)
    }
  }

  const toggleFullscreen = () => {
    onActivity()
    pushLearnEvent('l_learn_lecture_video_fullscreen_toggle')
    const element = fullscreenContainerRef.current
    if (!element) return
    if (!document.fullscreenElement) {
      void element.requestFullscreen()
    } else {
      void document.exitFullscreen()
    }
  }

  const openAssistant = () => {
    onActivity()
    pushLearnEvent('l_learn_lecture_ask_ai_open')
    splitChat?.open()
  }

  return (
    <>
      <style>{LECTURE_VIDEO_OVERFLOW_VOLUME_CSS}</style>
      <div className="flex min-w-0 items-center justify-between gap-1.5 min-[380px]:gap-2">
        <div className="flex min-w-0 items-center gap-1 min-[380px]:gap-2 md:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-surface/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition duration-150 active:scale-90"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" weight="fill" />
            ) : (
              <Play className="h-6 w-6" weight="fill" />
            )}
          </button>
          <span className="min-w-0 truncate font-mono text-xs tabular-nums text-white md:text-sm">
            {formatVideoClock(displaySeconds, numeratorLongFmt)}
            {/* Duration hides on very narrow screens so one row fits at 320px. */}
            <span className="hidden min-[380px]:inline">
              {' '}
              / {denominatorLabel}
            </span>
          </span>
        </div>

        {/* min-w-0 (not shrink-0) so the Ask pill can give way on narrow screens
            while the fixed icon buttons keep their hit areas. */}
        <div className="flex min-w-0 items-center gap-0.5 md:gap-1">
          {splitChat && !splitChat.isOpen ? (
            <LectureVideoAskAiPill
              onClick={openAssistant}
              className="min-w-0 shrink overflow-hidden"
            />
          ) : null}
          {transcriptAvailable ? (
            <button
              type="button"
              onClick={() => {
                onActivity()
                onCaptionsToggle()
              }}
              aria-pressed={captionsOn}
              aria-label={captionsOn ? 'Turn off captions' : 'Turn on captions'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-surface/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition duration-150 active:scale-90"
            >
              <ClosedCaptioning
                className="h-6 w-6"
                weight={captionsOn ? 'fill' : 'bold'}
              />
            </button>
          ) : null}
          <button
            type="button"
            onClick={toggleMute}
            disabled={!volumeUiSupported}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-surface/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition duration-150 active:scale-90 disabled:pointer-events-none disabled:opacity-40"
            aria-label={mutedUi ? 'Unmute' : 'Mute'}
          >
            {mutedUi || volumeUi === 0 ? (
              <SpeakerSlash className="h-6 w-6" weight="bold" />
            ) : (
              <SpeakerHigh className="h-6 w-6" weight="bold" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-surface/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition duration-150 active:scale-90"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <CornersIn className="h-6 w-6" weight="bold" />
            ) : (
              <CornersOut className="h-6 w-6" weight="bold" />
            )}
          </button>
          <div className="relative shrink-0" ref={overflowMenuRef}>
            <button
              type="button"
              aria-expanded={overflowMenuOpen}
              aria-haspopup="dialog"
              aria-controls="lecture-video-overflow-menu"
              onClick={() => {
                onActivity()
                setOverflowMenuOpen((open) => !open)
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-surface/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition duration-150 active:scale-90"
              aria-label="More: volume, playback speed and quality"
            >
              <DotsThreeOutlineVertical className="h-6 w-6" weight="bold" />
            </button>
            {overflowMenuOpen ? (
              <div
                id="lecture-video-overflow-menu"
                role="dialog"
                aria-label="Volume and playback"
                className="absolute bottom-full right-0 z-[60] mb-1 w-[min(100vw-1.5rem,16rem)] min-w-[200px] rounded-lg border border-white/10 bg-[#141414] p-3 shadow-lg"
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="mb-2 block text-xs font-medium text-white/70">
                      Volume
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleMute}
                        disabled={!volumeUiSupported}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-surface/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-40"
                        aria-label={mutedUi ? 'Unmute' : 'Mute'}
                      >
                        {mutedUi || volumeUi === 0 ? (
                          <SpeakerSlash className="h-5 w-5" weight="bold" />
                        ) : (
                          <SpeakerHigh className="h-5 w-5" weight="bold" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={mutedUi ? 0 : volumeUi}
                        onChange={onVolumeInput}
                        disabled={!volumeUiSupported}
                        className="lecture-video-overflow-volume accent-white min-w-0 flex-1 cursor-pointer disabled:cursor-not-allowed"
                        style={{
                          ['--vol-pct' as string]: `${(mutedUi ? 0 : volumeUi) * 100}%`,
                        }}
                        aria-label="Volume"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="lecture-video-playback-rate"
                      className="mb-2 block text-xs font-medium text-white/70"
                    >
                      Playback speed
                    </label>
                    <select
                      id="lecture-video-playback-rate"
                      value={
                        PLAYBACK_RATE_OPTIONS.find(
                          (rate) => Math.abs(rate - playbackRate) < 0.001,
                        ) ?? 1
                      }
                      onChange={(event) => {
                        onActivity()
                        onPlaybackRateChange(Number(event.target.value))
                      }}
                      className="h-9 w-full cursor-pointer rounded-md border border-white/15 bg-black/50 px-2 text-sm text-white outline-none hover:bg-surface/10 focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      {PLAYBACK_RATE_OPTIONS.map((rate) => (
                        <option key={rate} value={rate}>
                          {playbackRateLabel(rate)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {qualityLevels.length > 0 ? (
                    <div>
                      <label
                        htmlFor="lecture-video-quality"
                        className="mb-2 block text-xs font-medium text-white/70"
                      >
                        Quality
                      </label>
                      <select
                        id="lecture-video-quality"
                        value={currentQuality}
                        onChange={(event) => {
                          onActivity()
                          onQualityChange(Number(event.target.value))
                        }}
                        className="h-9 w-full cursor-pointer rounded-md border border-white/15 bg-black/50 px-2 text-sm text-white outline-none hover:bg-surface/10 focus-visible:ring-2 focus-visible:ring-white/40"
                      >
                        <option value={-1}>Auto</option>
                        {qualityLevels.map((level) => (
                          <option key={level.index} value={level.index}>
                            {level.height}p
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
