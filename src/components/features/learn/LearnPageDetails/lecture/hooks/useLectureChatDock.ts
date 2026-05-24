'use client'

import { useEffect, useRef, useState } from 'react'

import { shouldDockLectureChatAnchor } from './lectureChatDockLayout'

const CHAT_BAR_HEIGHT_PX = 48
const CHAT_BAR_BLOCK_PX = CHAT_BAR_HEIGHT_PX + 24

/**
 * When the inline chat anchor scrolls above the viewport, dock the bar to the bottom.
 */
export function useLectureChatDock(onDockedChange?: (isDocked: boolean) => void) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const onDockedChangeRef = useRef(onDockedChange)
  const [isDocked, setIsDocked] = useState(false)

  onDockedChangeRef.current = onDockedChange

  useEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return

    const syncDocked = () => {
      const docked = shouldDockLectureChatAnchor(anchor.getBoundingClientRect())
      setIsDocked(previous => {
        if (previous === docked) return previous
        onDockedChangeRef.current?.(docked)
        return docked
      })
    }

    syncDocked()

    const observer = new IntersectionObserver(
      ([entry]) => {
        const docked = shouldDockLectureChatAnchor(entry.boundingClientRect)
        setIsDocked(previous => {
          if (previous === docked) return previous
          onDockedChangeRef.current?.(docked)
          return docked
        })
      },
      { threshold: 0 },
    )

    observer.observe(anchor)
    window.addEventListener('scroll', syncDocked, { passive: true })
    window.visualViewport?.addEventListener('scroll', syncDocked)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', syncDocked)
      window.visualViewport?.removeEventListener('scroll', syncDocked)
    }
  }, [])

  return {
    anchorRef,
    isDocked,
    chatBarHeightPx: CHAT_BAR_HEIGHT_PX,
    chatBarBlockPx: CHAT_BAR_BLOCK_PX,
  }
}
