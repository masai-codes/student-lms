'use client'

import { useEffect, useState } from 'react'

/**
 * Brief overlay sweep on open; does not block message list rendering underneath.
 */
export function useLectureChatPanelOpeningLoader(
  isOpen: boolean,
  sweepDurationMs: number,
  showOpeningLoader: boolean,
) {
  const [showSweepOverlay, setShowSweepOverlay] = useState(false)

  useEffect(() => {
    if (!isOpen || !showOpeningLoader) {
      setShowSweepOverlay(false)
      return
    }

    setShowSweepOverlay(true)
    const timer = window.setTimeout(() => {
      setShowSweepOverlay(false)
    }, sweepDurationMs)

    return () => window.clearTimeout(timer)
  }, [isOpen, sweepDurationMs, showOpeningLoader])

  return {
    showOpeningLoader: showSweepOverlay,
  }
}
