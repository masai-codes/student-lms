'use client'

import { useTrackToggle } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { useCallback, useState } from 'react'

type UseAiTutorMicOptions = {
  /**
   * Connects (or reuses) the LiveKit session before publishing the mic track.
   * Returning `false` means we should NOT enable the microphone (e.g. session
   * failed to start because the lecture transcript is unavailable).
   */
  ensureConnected: () => Promise<boolean>
}

type UseAiTutorMicResult = {
  isMicEnabled: boolean
  isMicPending: boolean
  toggleMic: () => Promise<void>
}

/**
 * Wraps LiveKit's mic track toggle so the LMS can:
 * - lazily create the AI tutor session on the first click,
 * - track an extra "starting" state while the session is being set up,
 * - never enable the mic if session creation fails.
 */
export function useAiTutorMic({
  ensureConnected,
}: UseAiTutorMicOptions): UseAiTutorMicResult {
  const { toggle, enabled, pending } = useTrackToggle({
    source: Track.Source.Microphone,
  })
  const [isStarting, setIsStarting] = useState(false)

  const toggleMic = useCallback(async () => {
    if (enabled) {
      await toggle(false)
      return
    }

    setIsStarting(true)
    try {
      const ok = await ensureConnected()
      if (!ok) return
      await toggle(true)
    } finally {
      setIsStarting(false)
    }
  }, [enabled, ensureConnected, toggle])

  return {
    isMicEnabled: enabled,
    isMicPending: pending || isStarting,
    toggleMic,
  }
}
