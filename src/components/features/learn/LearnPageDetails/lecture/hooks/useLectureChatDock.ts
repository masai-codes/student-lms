'use client'

import { useEffect, useRef, useState } from 'react'

const CHAT_BAR_HEIGHT_PX = 48
const CHAT_BAR_BLOCK_PX = CHAT_BAR_HEIGHT_PX + 24

/**
 * When the inline chat anchor scrolls out of view, dock the bar to the viewport bottom.
 */
export function useLectureChatDock(onDockedChange?: (isDocked: boolean) => void) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const onDockedChangeRef = useRef(onDockedChange)
  const [isDocked, setIsDocked] = useState(false)

  onDockedChangeRef.current = onDockedChange

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const docked = !entry.isIntersecting
        setIsDocked(docked)
        onDockedChangeRef.current?.(docked)
      },
      { threshold: 0 },
    )

    observer.observe(anchor)
    return () => observer.disconnect()
  }, [])

  return {
    anchorRef,
    isDocked,
    chatBarHeightPx: CHAT_BAR_HEIGHT_PX,
    chatBarBlockPx: CHAT_BAR_BLOCK_PX,
  }
}
