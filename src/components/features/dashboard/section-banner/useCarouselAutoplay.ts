import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { EmblaCarouselType } from 'embla-carousel'

/** Default auto-advance interval (ms) for the dashboard banner carousels. */
const BANNER_AUTOPLAY_MS = 5000

/**
 * Per-banner intervals, intentionally staggered so stacked carousels don't all
 * flip at the same moment (each changes at a different time).
 */
export const ONBOARDING_AUTOPLAY_MS = 4000
export const FEE_PAYMENT_AUTOPLAY_MS = 5000
export const BATCH_START_AUTOPLAY_MS = 6000
export const BATCH_TRANSFER_AUTOPLAY_MS = 7000

export interface CarouselAutoplayHandlers {
  /** Spread onto the carousel root so hovering pauses auto-advance. */
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/**
 * Auto-advances an embla carousel every `intervalMs` while it has more than one
 * slide. Pair with `loop: true` so it wraps past the last slide. No-op for a
 * single slide (or before embla initialises).
 *
 * Returns hover handlers to spread on the carousel root — while the pointer is
 * over the banner, auto-advance pauses (and resumes on leave).
 */
export function useCarouselAutoplay(
  emblaApi: EmblaCarouselType | undefined,
  slideCount: number,
  intervalMs: number = BANNER_AUTOPLAY_MS,
): CarouselAutoplayHandlers {
  const pausedRef = useRef(false)

  useEffect(() => {
    if (!emblaApi || slideCount <= 1) return
    const timer = setInterval(() => {
      if (!pausedRef.current) emblaApi.scrollNext()
    }, intervalMs)
    return () => clearInterval(timer)
  }, [emblaApi, slideCount, intervalMs])

  const onMouseEnter = useCallback(() => {
    pausedRef.current = true
  }, [])
  const onMouseLeave = useCallback(() => {
    pausedRef.current = false
  }, [])

  return useMemo(
    () => ({ onMouseEnter, onMouseLeave }),
    [onMouseEnter, onMouseLeave],
  )
}
