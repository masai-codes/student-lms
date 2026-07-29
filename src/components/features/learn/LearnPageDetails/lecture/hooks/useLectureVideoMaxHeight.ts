'use client'

import { useLayoutEffect, useRef, useState } from 'react'

/** Below `md` the video keeps its natural aspect height (no cap). */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
const TITLE_BLOCK_SELECTOR = '[data-lecture-title-block]'
/** Header top padding + a little slack so the tag row isn't flush to the edge. */
const RESERVE_BUFFER_PX = 28
/** Never shrink the video below this, even on very short viewports. */
const MIN_VIDEO_HEIGHT_PX = 240

/**
 * Caps the lecture video height so it can expand to fill the viewport while
 * always leaving the title + tag rows visible below it (rather than pushing
 * them off-screen). The cap is `viewport − videoTop − (titleBlock + buffer)`;
 * when the video's natural aspect height is shorter, that wins and there is no
 * letterboxing. Returns `undefined` below `md`, where the video is uncapped.
 */
export function useLectureVideoMaxHeight() {
  const videoRef = useRef<HTMLDivElement>(null)
  const [maxHeightPx, setMaxHeightPx] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const query = window.matchMedia(DESKTOP_MEDIA_QUERY)

    const measure = () => {
      const video = videoRef.current
      if (!video || !query.matches) {
        setMaxHeightPx(undefined)
        return
      }
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      // Where the video sits with nothing scrolled. On desktop the left column
      // scrolls itself (LectureSplitLayout), so `window.scrollY` alone leaves
      // `rect.top` negative mid-page and inflates the cap on the next resize.
      const scroller = video.closest<HTMLElement>(
        '[data-lecture-scroll-container]',
      )
      const top =
        video.getBoundingClientRect().top +
        window.scrollY +
        (scroller?.scrollTop ?? 0)
      const titleBlock =
        document.querySelector<HTMLElement>(TITLE_BLOCK_SELECTOR)
      const reserve = (titleBlock?.offsetHeight ?? 0) + RESERVE_BUFFER_PX
      const available = viewportHeight - top - reserve
      setMaxHeightPx(Math.max(Math.floor(available), MIN_VIDEO_HEIGHT_PX))
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

  return { videoRef, maxHeightPx }
}
