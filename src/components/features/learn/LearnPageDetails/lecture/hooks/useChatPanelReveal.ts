'use client'

import { useEffect, useState } from 'react'

/** Duration (ms) of the chat side-panel open/close animation. */
export const CHAT_PANEL_REVEAL_MS = 300

/**
 * Open/close animation flags for the chat side panel. Keeps the panel mounted
 * through its close transition so it animates out, and skips the intro when it
 * is already open on first paint (restored state).
 *
 * - `isRendered` — mount the panel (stays true through the close transition).
 * - `isOpenAnim` — drive the reveal (width/opacity) to open vs. closed.
 */
export function useChatPanelReveal(shouldShow: boolean) {
  const [isRendered, setIsRendered] = useState(shouldShow)
  const [isOpenAnim, setIsOpenAnim] = useState(shouldShow)

  useEffect(() => {
    if (shouldShow) {
      setIsRendered(true)
      // Double rAF: mount collapsed, let the browser paint it, then expand so
      // the width transition actually runs instead of being coalesced away.
      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setIsOpenAnim(true))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }
    setIsOpenAnim(false)
    const timer = setTimeout(() => setIsRendered(false), CHAT_PANEL_REVEAL_MS)
    return () => clearTimeout(timer)
  }, [shouldShow])

  return { isRendered, isOpenAnim }
}
