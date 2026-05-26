'use client'

import { CaretDoubleLeft, CaretDoubleRight, Play } from '@phosphor-icons/react'

type SeekHint = 'forward' | 'backward' | null

type VideoPlaybackOverlaysProps = {
  isVideoPlaying: boolean
  onCenterPlay: () => void
  seekHint: SeekHint
}

const seekIconClass =
  'h-5 w-5 shrink-0 text-white [filter:drop-shadow(0_0_2px_rgba(0,0,0,0.95))_drop-shadow(0_1px_3px_rgba(0,0,0,0.85))] md:h-6 md:w-6'

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
            onClick={event => {
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
      {seekHint === 'backward' ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[41] flex items-center justify-start pl-3 md:pl-8"
          aria-hidden
        >
          <CaretDoubleLeft className={seekIconClass} weight="bold" />
        </div>
      ) : null}
      {seekHint === 'forward' ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[41] flex items-center justify-end pr-3 md:pr-8"
          aria-hidden
        >
          <CaretDoubleRight className={seekIconClass} weight="bold" />
        </div>
      ) : null}
    </>
  )
}
