'use client'

import { useEffect, useState, type RefObject } from 'react'

import { FULLSCREEN_CHANGE_EVENTS } from './lectureVideoFullscreen.utils'

/**
 * Whether an element currently generates a layout box — false while it sits
 * inside a `display: none` subtree.
 *
 * `getClientRects()` is the test rather than `offsetParent`, which is also
 * `null` for a `position: fixed` element and would misreport the fullscreen
 * player. Note this is deliberately *not* an on-screen check: `visibility:
 * hidden` and scrolled-out-of-view elements still have boxes, and both should
 * count as rendered.
 *
 * It re-measures on resize (which covers rotation and breakpoint crossings) and
 * on fullscreen change — the two things that flip a lecture hero row between
 * `display: none` and visible. There's no observer for "an ancestor's class
 * changed", so a caller that hides a row by some other means would need to
 * prompt a re-measure itself.
 */
export function useHasLayoutBox(
  elementRef: RefObject<HTMLElement | null>,
): boolean {
  const [hasBox, setHasBox] = useState(false)

  useEffect(() => {
    const sync = () => {
      const element = elementRef.current
      setHasBox(Boolean(element && element.getClientRects().length > 0))
    }

    window.addEventListener('resize', sync)
    for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
      document.addEventListener(eventName, sync)
    }
    sync()

    return () => {
      window.removeEventListener('resize', sync)
      for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
        document.removeEventListener(eventName, sync)
      }
    }
  }, [elementRef])

  return hasBox
}
