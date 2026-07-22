'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { getStableHeroRootTopPx } from './lectureViewportLayout'

/** Below this the page uses natural window scroll (mobile dock, no side rail). */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
const MIN_SPLIT_ROW_HEIGHT_PX = 320

/**
 * Sizes the desktop lecture split row so it exactly fills the viewport below the
 * sticky app header. The row then owns a bounded height, letting the left page
 * column and the right AI-chat rail each scroll independently (the page scrolls
 * without moving the chat; the chat scrolls its own thread).
 *
 * Returns `heightPx: undefined` / `isDesktop: false` below `md`, where the page
 * falls back to natural window scrolling with the mobile chat dock.
 */
export function useLectureSplitRowHeight() {
  const rowRef = useRef<HTMLDivElement>(null)
  const [heightPx, setHeightPx] = useState<number | undefined>(undefined)
  const [isDesktop, setIsDesktop] = useState(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const query = window.matchMedia(DESKTOP_MEDIA_QUERY)

    const measure = () => {
      const row = rowRef.current
      if (!row || !query.matches) {
        setIsDesktop(query.matches)
        setHeightPx(undefined)
        return
      }
      setIsDesktop(true)
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      // `.top` is stable while the page doesn't window-scroll; the +scrollY
      // guard keeps it correct if it ever does.
      const top = getStableHeroRootTopPx(row, window.scrollY)
      setHeightPx(
        Math.max(Math.floor(viewportHeight - top), MIN_SPLIT_ROW_HEIGHT_PX),
      )
    }

    measure()
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    query.addEventListener('change', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
      query.removeEventListener('change', measure)
    }
  }, [])

  return { rowRef, heightPx, isDesktop }
}
