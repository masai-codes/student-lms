import { useCallback, useRef, useState } from 'react'
import { getOrCreateInterviewSttToken } from '@/lib/api/interviews/sttTokenCache'
import {
  createLiveSttSession,
  type LiveSttSession,
} from '@/lib/audio/liveSttSession'

/**
 * Bridges the interview session id to a `liveSttSession` instance: reuses
 * (or mints, on first use) a short-lived client secret for this session,
 * opens the WebRTC connection against the caller's mic stream, and surfaces
 * the live partial transcript while recording. `stop()` returns the final
 * transcript text once the in-flight segment finalizes. `start`/`stop`/
 * `cancel` are stable identities (via `useCallback`) so callers can safely
 * depend on them from an effect — e.g. starting the session once
 * `useInterviewRecorder`'s `mediaStream` shows up on a later render.
 */
export function useLiveInterviewStt(sessionId: number | string) {
  const [partialTranscript, setPartialTranscript] = useState('')
  const sessionRef = useRef<LiveSttSession | null>(null)

  const start = useCallback(
    async (mediaStream: MediaStream): Promise<void> => {
      setPartialTranscript('')
      const { clientSecret } = await getOrCreateInterviewSttToken(sessionId)

      const session = createLiveSttSession()
      session.onPartialTranscript(setPartialTranscript)
      sessionRef.current = session
      await session.start(mediaStream, clientSecret)
    },
    [sessionId],
  )

  const stop = useCallback(async (): Promise<string> => {
    const session = sessionRef.current
    sessionRef.current = null
    if (!session) return ''
    return session.stop()
  }, [])

  const cancel = useCallback((): void => {
    sessionRef.current?.cancel()
    sessionRef.current = null
  }, [])

  return { partialTranscript, start, stop, cancel }
}
