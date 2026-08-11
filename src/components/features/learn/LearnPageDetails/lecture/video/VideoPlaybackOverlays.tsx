'use client'

import { CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react'

import type { CSSProperties } from 'react'

type SeekHint = 'forward' | 'backward' | null

type VideoPlaybackOverlaysProps = {
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
  // Literal white glass (not `surface`): the seek badge floats on the video,
  // which is fixed-dark in both themes.
  'flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full border border-white/15 bg-white/10 text-white shadow-[0_4px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 md:h-[4.5rem] md:w-[4.5rem]'

const seekLabelClass = 'text-xs font-semibold leading-none text-white/90'

export function VideoPlaybackOverlays({
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
