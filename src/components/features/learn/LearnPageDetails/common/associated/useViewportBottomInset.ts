'use client'

import { useLayoutEffect, useState } from 'react'

export function measureViewportBottomInset(selector: string): number {
  const element = document.querySelector(selector)
  if (!element) return 0

  const rect = element.getBoundingClientRect()
  // A hidden element (e.g. the mobile tab bar under `lg:hidden` on desktop)
  // reports a zero-size rect at the origin — reserving `innerHeight - 0` would
  // swallow the whole viewport, so treat it as "nothing to reserve".
  if (rect.height === 0) return 0

  return Math.max(0, Math.ceil(window.innerHeight - rect.top))
}

/**
 * Returns pixels to reserve at the viewport bottom (e.g. fixed assignment footer + mobile tab bar).
 */
export function useViewportBottomInset(
  selector: string | undefined,
  enabled: boolean,
): number {
  const [insetPx, setInsetPx] = useState(0)

  useLayoutEffect(() => {
    if (!enabled || selector == null || selector.trim() === '') {
      setInsetPx(0)
      return
    }

    const measure = () => {
      setInsetPx(measureViewportBottomInset(selector))
    }

    measure()

    const element = document.querySelector(selector)
    const resizeObserver = element != null ? new ResizeObserver(measure) : null
    if (element != null) {
      resizeObserver?.observe(element)
    }

    window.addEventListener('resize', measure)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [enabled, selector])

  return insetPx
}
