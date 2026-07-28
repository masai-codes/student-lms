'use client'

import { useEffect } from 'react'

/**
 * Attribute set on `<html>` while the lock is active. The rules that act on it
 * live in `styles.css` (search for "Viewport lock"), gated to `lg`+.
 */
export const VIEWPORT_LOCK_ATTRIBUTE = 'data-viewport-locked'

/**
 * Pins the app shell to the viewport and takes scrolling away from the document,
 * for pages that scroll inside their own columns instead (the lecture split
 * layout: page column | AI chat rail).
 *
 * Driven from JS rather than a `:has()` selector on the shell so the page that
 * needs the lock is the page that turns it on — nothing depends on an ancestor
 * matching a descendant, and the effect's cleanup guarantees the document gets
 * its scroll back the instant this page unmounts or the viewport drops below the
 * rail breakpoint. Idempotent: two locked pages overlapping during a route
 * transition just set the same attribute twice.
 */
export function useViewportScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return

    const root = document.documentElement
    root.setAttribute(VIEWPORT_LOCK_ATTRIBUTE, 'true')

    return () => {
      root.removeAttribute(VIEWPORT_LOCK_ATTRIBUTE)
    }
  }, [active])
}
