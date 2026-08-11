import { useEffect, useState } from 'react'

/**
 * Phone-sized viewport — matched on the *short* edge rather than the width, so
 * the answer doesn't change when the device rotates.
 *
 * Width alone was wrong in one very visible case: the lecture player locks the
 * screen to landscape when a video goes fullscreen (see
 * `lockLandscapeOrientation`), which swings a phone's `width` to its long edge
 * — 844px on an iPhone 14, 915px on a Pixel 7 — and reported the phone as a
 * desktop. Anything keyed off this hook then swapped to its desktop surface
 * mid-lecture.
 *
 * `pointer: coarse` keeps the height clause to touch devices, so a desktop
 * window dragged flat stays desktop. Tablets are unaffected: an iPad is 768px
 * on its short edge in either rotation, one pixel above the threshold.
 */
const MOBILE_MEDIA_QUERY =
  '(max-width: 767px), (max-height: 767px) and (pointer: coarse)'

export function getIsMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(getIsMobileViewport)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const sync = () => {
      setIsMobile(mediaQuery.matches)
    }
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  return isMobile
}
