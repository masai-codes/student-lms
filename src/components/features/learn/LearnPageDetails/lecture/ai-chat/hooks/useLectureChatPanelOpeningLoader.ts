'use client'

import { useEffect, useState } from 'react'

/**
 * Shows the opening sweep loader until `sweepDurationMs` elapses after each open.
 */
export function useLectureChatPanelOpeningLoader(
  isOpen: boolean,
  sweepDurationMs: number,
  showOpeningLoader: boolean,
) {
  const [isContentReady, setIsContentReady] = useState(!showOpeningLoader)

  useEffect(() => {
    if (!isOpen) {
      setIsContentReady(false)
      return
    }

    if (!showOpeningLoader) {
      setIsContentReady(true)
      return
    }

    setIsContentReady(false)
    const timer = window.setTimeout(() => {
      setIsContentReady(true)
    }, sweepDurationMs)

    return () => window.clearTimeout(timer)
  }, [isOpen, sweepDurationMs, showOpeningLoader])

  return {
    showOpeningLoader: showOpeningLoader && isOpen && !isContentReady,
    isContentReady,
  }
}
