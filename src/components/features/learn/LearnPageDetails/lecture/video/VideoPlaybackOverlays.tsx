'use client'

import { CaretDoubleLeft, CaretDoubleRight, Play } from '@phosphor-icons/react'

type SeekHint = 'forward' | 'backward' | null

type VideoPlaybackOverlaysProps = {
  isVideoPlaying: boolean
  onCenterPlay: () => void
  seekHint: SeekHint
}

/** Matches the ±5s used by the keyboard/double-tap/slider seek shortcuts. */
const SEEK_STEP_SECONDS = 5

const seekIconClass = 'h-6 w-6 shrink-0 text-white md:h-7 md:w-7'

const seekBadgeClass =
  'flex flex-col items-center gap-1 rounded-2xl bg-black/60 px-4 py-3 text-white shadow-[0_2px_16px_rgba(0,0,0,0.5)] backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150'

const seekLabelClass = 'text-xs font-semibold leading-none text-white/90'

export function VideoPlaybackOverlays({
  isVideoPlaying,
  onCenterPlay,
  seekHint,
}: VideoPlaybackOverlaysProps) {
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
          (keyboard / double-tap / slider). Backward hint hugs the left edge,
          forward the right edge; both vertically centred via translate so the
          position never depends on flex quirks of the player wrapper. */}
      {seekHint === 'backward' ? (
        <div
          className="pointer-events-none absolute left-[max(0.75rem,env(safe-area-inset-left,0px))] top-1/2 z-[41] -translate-y-1/2 md:left-8"
          aria-hidden
        >
          <div className={seekBadgeClass}>
            <CaretDoubleLeft className={seekIconClass} weight="fill" />
            <span className={seekLabelClass}>{SEEK_STEP_SECONDS}s</span>
          </div>
        </div>
      ) : null}
      {seekHint === 'forward' ? (
        <div
          className="pointer-events-none absolute right-[max(0.75rem,env(safe-area-inset-right,0px))] top-1/2 z-[41] -translate-y-1/2 md:right-8"
          aria-hidden
        >
          <div className={seekBadgeClass}>
            <CaretDoubleRight className={seekIconClass} weight="fill" />
            <span className={seekLabelClass}>{SEEK_STEP_SECONDS}s</span>
          </div>
        </div>
      ) : null}
    </>
  )
}
