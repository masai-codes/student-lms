'use client'

import { useEffect, useState } from 'react'

export const LECTURE_CHAT_PANEL_ANIMATION_MS = 480
const LECTURE_CHAT_PANEL_CLOSE_MS = 400

/**
 * Keeps the panel mounted while the close animation finishes; delays open transform
 * until after paint so the roll-up transition is visible.
 */
export function useLectureChatPanelAnimation(isOpen: boolean) {
  const [isPresent, setIsPresent] = useState(isOpen)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setIsPresent(true)

      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setIsExpanded(true))
      })

      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }

    setIsExpanded(false)
    setIsClosing(true)

    const timer = window.setTimeout(() => {
      setIsPresent(false)
      setIsClosing(false)
    }, LECTURE_CHAT_PANEL_CLOSE_MS)

    return () => window.clearTimeout(timer)
  }, [isOpen])

  return {
    isPresent,
    isExpanded,
    isClosing,
    isActive: isPresent,
  }
}
