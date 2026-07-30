'use client'

import { useEffect, useRef, useState } from 'react'
import {
  CaretLeft,
  CaretRight,
  Check,
  ClosedCaptioning,
  CornersIn,
  CornersOut,
  FadersHorizontal,
  Gauge,
  GearSix,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerLow,
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
import {
  FULLSCREEN_CHANGE_EVENTS,
  getFullscreenElement,
  toggleLectureVideoFullscreen,
} from '../hooks/lectureVideoFullscreen.utils'
import type { LectureChromePlayerRef } from './lectureVideoChrome.utils'
import {
  playVideoWithRecovery,
  type LectureVideoQualityLevel,
} from '../hooks/useLectureVideoAttendance'
import {
  AskAiPillContent,
  askAiPillClass,
} from '@/components/features/lecture-ai-chat/components/AskAiPill'
import { pushLearnEvent } from '@/components/features/learn/shared/learnAnalytics'
import { cn } from '@/lib/utils'

/**
 * YouTube-style hover tooltip above a control. Hover-only (guarded by the
 * `hover: hover` media query) so it never sticks on touch devices; the
 * buttons keep their aria-labels for assistive tech. Pass `label: null` to
 * suppress it (e.g. while the settings menu is open above the button).
 */
function ControlTooltip({
  label,
  align = 'center',
  children,
}: {
  label: string | null
  align?: 'left' | 'center' | 'right'
  children: React.ReactNode
}) {
  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2'
  return (
    <span className="group/tt relative flex shrink-0">
      {children}
      {label !== null ? (
        <span
          role="tooltip"
          className={`pointer-events-none absolute bottom-[calc(100%+0.875rem)] z-[70] ${alignClass} translate-y-1 scale-95 whitespace-nowrap rounded-lg border border-white/15 bg-black/75 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-150 ease-out [@media(hover:hover)]:group-hover/tt:translate-y-0 [@media(hover:hover)]:group-hover/tt:scale-100 [@media(hover:hover)]:group-hover/tt:opacity-100`}
        >
          {label}
        </span>
      ) : null}
    </span>
  )
}

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
  /** Opens the lecture AI chat; the "Ask AI" pill renders only when provided. */
  onOpenAiChat?: () => void
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
  onOpenAiChat,
}: LectureVideoControlsToolbarProps) {
  const overflowMenuRef = useRef<HTMLDivElement>(null)
  const [volumeUi, setVolumeUi] = useState(1)
  const [mutedUi, setMutedUi] = useState(false)
  const [volumeUiSupported, setVolumeUiSupported] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false)
  // YouTube-style settings menu drill-down: main list → speed / quality.
  const [menuView, setMenuView] = useState<'main' | 'speed' | 'quality'>('main')

  useEffect(() => {
    if (!overflowMenuOpen) setMenuView('main')
  }, [overflowMenuOpen])

  const numeratorLongFmt =
    totalDuration >= 3600 || (totalDuration <= 0 && displaySeconds >= 3600)
  const denominatorLabel =
    totalDuration > 0
      ? formatVideoClock(totalDuration, totalDuration >= 3600)
      : '--:--'

  useEffect(() => {
    const onFullscreenChange = () => {
      const element = fullscreenContainerRef.current
      setIsFullscreen(Boolean(element && getFullscreenElement() === element))
    }
    for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
      document.addEventListener(eventName, onFullscreenChange)
    }
    onFullscreenChange()
    return () => {
      for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
        document.removeEventListener(eventName, onFullscreenChange)
      }
    }
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
      if (video.paused) playVideoWithRecovery(video)
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
    // Standard/prefixed element fullscreen where available; iPhone Safari has
    // neither, so this falls back to the native video fullscreen player.
    toggleLectureVideoFullscreen(
      fullscreenContainerRef.current,
      getHtmlVideoFromPlayer(videoRef),
    )
  }

  // Frosted-glass chrome: standalone circular pills for primary actions and a
  // grouped capsule for secondary ones, floating over the video like the new
  // YouTube glass player.
  const glassPillClass =
    'border border-white/15 bg-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl'
  const clusterButtonClass =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition duration-200 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-90 md:h-11 md:w-11'

  return (
    <>
      <style>{LECTURE_VIDEO_OVERFLOW_VOLUME_CSS}</style>
      <div className="flex min-w-0 items-center justify-between gap-1.5 min-[380px]:gap-2">
        {/* Left cluster — YouTube order: play, volume (slider on hover), time. */}
        <div
          className={`flex min-w-0 items-center gap-0.5 rounded-full p-0.5 ${glassPillClass}`}
        >
          <ControlTooltip
            label={isPlaying ? 'Pause (space)' : 'Play (space)'}
            align="left"
          >
            <button
              type="button"
              onClick={togglePlay}
              className={clusterButtonClass}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 md:h-6 md:w-6" weight="fill" />
              ) : (
                <Play className="h-5 w-5 md:h-6 md:w-6" weight="fill" />
              )}
            </button>
          </ControlTooltip>
          {/* Volume is hidden on mobile — it lives in the settings menu there
              (and the device has hardware volume keys). Desktop keeps the
              inline mute button + hover slider. */}
          <div className="group/volume hidden shrink-0 items-center md:flex">
            <ControlTooltip
              label={mutedUi || volumeUi === 0 ? 'Unmute' : 'Mute'}
            >
              <button
                type="button"
                onClick={toggleMute}
                disabled={!volumeUiSupported}
                className={`${clusterButtonClass} disabled:pointer-events-none disabled:opacity-40`}
                aria-label={mutedUi ? 'Unmute' : 'Mute'}
              >
                {mutedUi || volumeUi === 0 ? (
                  <SpeakerSlash
                    className="h-5 w-5 md:h-6 md:w-6"
                    weight="fill"
                  />
                ) : volumeUi < 0.5 ? (
                  <SpeakerLow className="h-5 w-5 md:h-6 md:w-6" weight="fill" />
                ) : (
                  <SpeakerHigh
                    className="h-5 w-5 md:h-6 md:w-6"
                    weight="fill"
                  />
                )}
              </button>
            </ControlTooltip>
            {/* YouTube-style volume slider: slides out on hover / keyboard
                focus. Desktop-only — on small/touch screens the expansion
                would overflow the toolbar row, so volume lives in the
                settings menu there. */}
            {volumeUiSupported ? (
              // Expanded width leaves ~8px of slack past the input so the
              // round thumb at 100% volume isn't clipped flat by this
              // overflow-hidden reveal container.
              <div className="hidden h-11 w-0 items-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-focus-within/volume:w-24 group-focus-within/volume:opacity-100 group-hover/volume:w-24 group-hover/volume:opacity-100 md:flex">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={mutedUi ? 0 : volumeUi}
                  onChange={onVolumeInput}
                  className="lecture-video-overflow-volume mx-1.5 shrink-0 cursor-pointer"
                  // Width inline: the shared .lecture-video-overflow-volume CSS
                  // sets `width: 100%` with higher specificity than a Tailwind
                  // width class, which stretched this past the reveal container
                  // and clipped the thumb flat at max volume.
                  style={{
                    width: '4.75rem',
                    ['--vol-pct' as string]: `${(mutedUi ? 0 : volumeUi) * 100}%`,
                  }}
                  aria-label="Volume"
                />
              </div>
            ) : null}
          </div>
          <span className="flex h-9 min-w-0 items-center truncate px-2 font-mono text-xs tabular-nums text-white md:h-11 md:px-3 md:text-base">
            {formatVideoClock(displaySeconds, numeratorLongFmt)}
            {/* Duration hides on very narrow screens so one row fits at 320px. */}
            <span className="hidden min-[380px]:inline">
              &nbsp;
              <span className="text-white/60">/ {denominatorLabel}</span>
            </span>
          </span>
        </div>

        <div
          className={`flex min-w-0 items-center gap-0.5 rounded-full p-0.5 ${glassPillClass}`}
        >
          {onOpenAiChat ? (
            <ControlTooltip label="Ask AI about this lecture">
              {/* Always available: opens the right-side rail on laptop/desktop
                  and the bottom drawer on mobile/tablet. Compact icon-only on
                  phones so it fits the narrow toolbar, full pill from `sm` up. */}
              <button
                type="button"
                onClick={() => {
                  onActivity()
                  onOpenAiChat()
                }}
                className={cn(
                  askAiPillClass,
                  'inline-flex shrink-0 max-sm:h-9 max-sm:w-9 max-sm:gap-0 max-sm:px-0',
                )}
                aria-label="Ask AI about this lecture"
              >
                <AskAiPillContent />
              </button>
            </ControlTooltip>
          ) : null}
          {transcriptAvailable ? (
            <ControlTooltip label={captionsOn ? 'Captions on' : 'Captions off'}>
              <button
                type="button"
                onClick={() => {
                  onActivity()
                  onCaptionsToggle()
                }}
                aria-pressed={captionsOn}
                aria-label={
                  captionsOn ? 'Turn off captions' : 'Turn on captions'
                }
                className={clusterButtonClass}
              >
                <ClosedCaptioning
                  className="h-5 w-5 md:h-6 md:w-6"
                  weight={captionsOn ? 'fill' : 'bold'}
                />
              </button>
            </ControlTooltip>
          ) : null}
          <div className="relative shrink-0" ref={overflowMenuRef}>
            <ControlTooltip label={overflowMenuOpen ? null : 'Settings'}>
              <button
                type="button"
                aria-expanded={overflowMenuOpen}
                aria-haspopup="dialog"
                aria-controls="lecture-video-overflow-menu"
                onClick={() => {
                  onActivity()
                  setOverflowMenuOpen((open) => !open)
                }}
                className={clusterButtonClass}
                aria-label="Settings: volume, playback speed and quality"
              >
                <GearSix
                  className={`h-5 w-5 transition-transform duration-300 ease-out md:h-6 md:w-6 ${
                    overflowMenuOpen ? 'rotate-45' : ''
                  }`}
                  weight="fill"
                />
              </button>
            </ControlTooltip>
            {overflowMenuOpen ? (
              <div
                id="lecture-video-overflow-menu"
                role="dialog"
                aria-label="Settings"
                // The bottom offset clears the progress track that sits between
                // the toolbar and the video (track row is ~40px tall on mobile,
                // ~38px on md+), so the menu always opens above the track. The
                // menu opens upward, so on a short mobile video its tall speed
                // list could run past the top of the viewport — cap the height
                // and scroll internally so every option stays reachable.
                className="absolute bottom-[calc(100%+2.75rem)] right-0 z-[60] max-h-[55dvh] w-[min(100vw-1.5rem,17rem)] min-w-[220px] overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-black/60 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 duration-150 md:bottom-[calc(100%+3rem)]"
              >
                {menuView === 'main' ? (
                  <div className="flex flex-col">
                    {/* Volume is not here — it lives in the toolbar (desktop
                        hover slider); mobile relies on hardware volume keys. */}
                    <button
                      type="button"
                      onClick={() => {
                        onActivity()
                        setMenuView('speed')
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white transition duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    >
                      <Gauge className="h-5 w-5 shrink-0" weight="fill" />
                      <span className="flex-1 truncate text-left text-sm font-medium">
                        Playback speed
                      </span>
                      <span className="shrink-0 text-sm text-white/60">
                        {playbackRateLabel(playbackRate)}
                      </span>
                      <CaretRight
                        className="h-4 w-4 shrink-0 text-white/60"
                        weight="bold"
                      />
                    </button>
                    {qualityLevels.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          onActivity()
                          setMenuView('quality')
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-white transition duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      >
                        <FadersHorizontal
                          className="h-5 w-5 shrink-0"
                          weight="fill"
                        />
                        <span className="flex-1 truncate text-left text-sm font-medium">
                          Quality
                        </span>
                        <span className="shrink-0 text-sm text-white/60">
                          {currentQuality === -1
                            ? 'Auto'
                            : `${
                                qualityLevels.find(
                                  (level) => level.index === currentQuality,
                                )?.height ?? '?'
                              }p`}
                        </span>
                        <CaretRight
                          className="h-4 w-4 shrink-0 text-white/60"
                          weight="bold"
                        />
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col animate-in fade-in-0 slide-in-from-right-2 duration-150">
                    <button
                      type="button"
                      onClick={() => setMenuView('main')}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      aria-label="Back to settings"
                    >
                      <CaretLeft className="h-4 w-4 shrink-0" weight="bold" />
                      {menuView === 'speed' ? 'Playback speed' : 'Quality'}
                    </button>
                    <div className="mx-3 mb-1 h-px bg-white/10" />
                    <div className="flex max-h-56 flex-col overflow-y-auto">
                      {menuView === 'speed'
                        ? PLAYBACK_RATE_OPTIONS.map((rate) => {
                            const selected =
                              Math.abs(rate - playbackRate) < 0.001
                            return (
                              <button
                                key={rate}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => {
                                  onActivity()
                                  onPlaybackRateChange(rate)
                                  setMenuView('main')
                                }}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white transition duration-150 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                              >
                                <Check
                                  className={`h-4 w-4 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`}
                                  weight="bold"
                                />
                                {playbackRateLabel(rate)}
                              </button>
                            )
                          })
                        : [
                            { index: -1, label: 'Auto' },
                            ...qualityLevels.map((level) => ({
                              index: level.index,
                              label: `${level.height}p`,
                            })),
                          ].map((option) => {
                            const selected = option.index === currentQuality
                            return (
                              <button
                                key={option.index}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => {
                                  onActivity()
                                  onQualityChange(option.index)
                                  setMenuView('main')
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
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <ControlTooltip
            label={isFullscreen ? 'Exit full screen' : 'Full screen'}
            align="right"
          >
            <button
              type="button"
              onClick={toggleFullscreen}
              className={clusterButtonClass}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <CornersIn className="h-5 w-5 md:h-6 md:w-6" weight="bold" />
              ) : (
                <CornersOut className="h-5 w-5 md:h-6 md:w-6" weight="bold" />
              )}
            </button>
          </ControlTooltip>
        </div>
      </div>
    </>
  )
}
