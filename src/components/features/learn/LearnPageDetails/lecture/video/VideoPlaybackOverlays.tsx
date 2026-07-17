'use client'

import { CaretDoubleLeft, CaretDoubleRight, Play } from '@phosphor-icons/react'

import type { CSSProperties } from 'react'

type SeekHint = 'forward' | 'backward' | null

type VideoPlaybackOverlaysProps = {
  isVideoPlaying: boolean
  onCenterPlay: () => void
  seekHint: SeekHint
  /**
   * Intrinsic video aspect ratio (w/h). The <video> uses `object-fit: contain`
   * so the visible frame can be letter/pillar-boxed inside the wrapper; the
   * seek hints must anchor to the visible frame, not the wrapper edges.
   */
  videoAspectRatio?: number | null
}

/** Matches the ±5s used by the keyboard/double-tap/slider seek shortcuts. */
const SEEK_STEP_SECONDS = 5

const seekIconClass = 'h-6 w-6 shrink-0 text-white md:h-7 md:w-7'

const seekBadgeClass =
  'flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full bg-black/60 text-white shadow-[0_2px_16px_rgba(0,0,0,0.5)] backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150 md:h-[4.5rem] md:w-[4.5rem]'

const seekLabelClass = 'text-xs font-semibold leading-none text-white/90'

export function VideoPlaybackOverlays({
  isVideoPlaying,
  onCenterPlay,
  seekHint,
  videoAspectRatio,
}: VideoPlaybackOverlaysProps) {
  // An absolutely-positioned box with `inset-0 m-auto` + the video's aspect
  // ratio reproduces the `object-fit: contain` content box exactly, so the
  // hints sit on the video frame even when the wrapper is wider/taller.
  const videoBoxStyle: CSSProperties | undefined = videoAspectRatio
    ? {
        aspectRatio: `${videoAspectRatio}`,
        maxWidth: '100%',
        maxHeight: '100%',
      }
    : undefined

  return (
    <>
      {!isVideoPlaying ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onCenterPlay()
            }}
            className="pointer-events-auto inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black/70 text-white shadow-[0_2px_16px_rgba(0,0,0,0.6)] ring-2 ring-black/35 ring-offset-2 ring-offset-white/15 transition hover:bg-black/85 md:h-[4.25rem] md:w-[4.25rem]"
            aria-label="Play"
          >
            <Play
              className="h-6 w-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] md:h-7 md:w-7"
              weight="fill"
            />
          </button>
        </div>
      ) : null}
      {/* Transient seek feedback only — shown for ~650ms after a seek
          (keyboard / double-tap / slider). YouTube-style: backward hint sits
          inside the left side of the visible video frame, forward inside the
          right side, both vertically centred. */}
      {seekHint ? (
        <div
          className="pointer-events-none absolute inset-0 z-[41] m-auto"
          style={videoBoxStyle}
          aria-hidden
        >
          {seekHint === 'backward' ? (
            <div className="absolute left-[8%] top-1/2 -translate-y-1/2">
              <div className={seekBadgeClass}>
                <CaretDoubleLeft className={seekIconClass} weight="fill" />
                <span className={seekLabelClass}>{SEEK_STEP_SECONDS}s</span>
              </div>
            </div>
          ) : (
            <div className="absolute right-[8%] top-1/2 -translate-y-1/2">
              <div className={seekBadgeClass}>
                <CaretDoubleRight className={seekIconClass} weight="fill" />
                <span className={seekLabelClass}>{SEEK_STEP_SECONDS}s</span>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </>
  )
}
