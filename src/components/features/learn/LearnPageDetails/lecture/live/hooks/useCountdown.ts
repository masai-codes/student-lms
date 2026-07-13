'use client'

import { useEffect, useState } from 'react'

/**
 * Live countdown to an absolute target instant (epoch ms).
 *
 * Ticks once a second and returns the remaining milliseconds, clamped at 0.
 * Returns `null` when `targetMs` is null/non-finite (nothing to count down to),
 * so callers can cleanly skip rendering. The tick stops once the target is
 * reached to avoid a pointless 1s interval running forever.
 */
export function useCountdown(targetMs: number | null): number | null {
  const compute = (): number | null => {
    if (targetMs == null || !Number.isFinite(targetMs)) return null
    return Math.max(0, targetMs - Date.now())
  }

  const [remainingMs, setRemainingMs] = useState<number | null>(compute)

  useEffect(() => {
    if (targetMs == null || !Number.isFinite(targetMs)) {
      setRemainingMs(null)
      return
    }

    // Sync immediately in case props changed between renders, then tick.
    setRemainingMs(Math.max(0, targetMs - Date.now()))

    const id = window.setInterval(() => {
      const next = Math.max(0, targetMs - Date.now())
      setRemainingMs(next)
      if (next <= 0) window.clearInterval(id)
    }, 1000)

    return () => window.clearInterval(id)
  }, [targetMs])

  return remainingMs
}
