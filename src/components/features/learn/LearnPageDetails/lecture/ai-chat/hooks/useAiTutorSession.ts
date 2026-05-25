'use client'

import { useRoomContext } from '@livekit/components-react'
import { ConnectionState, RoomEvent } from 'livekit-client'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { AiTutorSession } from '@/server/ai-tutor/types'

import type { AiTutorSessionState } from '../types'
import {
  createAiTutorSessionRequest,
  dispatchAiTutorAgentRequest,
  endAiTutorSessionRequest,
  endAiTutorSessionWithBeacon,
} from '@/lib/api/learn/aiTutorApi'

type UseAiTutorSessionOptions = {
  lectureId: number
  language?: string
}

type UseAiTutorSessionResult = {
  state: AiTutorSessionState
  session: AiTutorSession | null
  agentJoined: boolean
  errorCode: string | null
  /** Ensures a connected session exists; safe to call multiple times. */
  ensureConnected: () => Promise<boolean>
  endSession: () => Promise<void>
}

function isAgentParticipantIdentity(identity: string | undefined): boolean {
  if (!identity) return false
  const lower = identity.toLowerCase()
  return lower.includes('agent') || lower.includes('tutor')
}

export function useAiTutorSession({
  lectureId,
  language = 'English',
}: UseAiTutorSessionOptions): UseAiTutorSessionResult {
  const room = useRoomContext()
  const [state, setState] = useState<AiTutorSessionState>('idle')
  const [session, setSession] = useState<AiTutorSession | null>(null)
  const [agentJoined, setAgentJoined] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const inflight = useRef<Promise<boolean> | null>(null)

  useEffect(() => {
    const handleParticipantConnected = (participant: { identity?: string }) => {
      if (isAgentParticipantIdentity(participant.identity)) {
        setAgentJoined(true)
      }
    }
    const handleParticipantDisconnected = (participant: {
      identity?: string
    }) => {
      if (isAgentParticipantIdentity(participant.identity)) {
        setAgentJoined(false)
      }
    }

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    }
  }, [room])

  const ensureConnected = useCallback(async (): Promise<boolean> => {
    if (room.state === ConnectionState.Connected && session) return true
    if (inflight.current) return inflight.current

    const task = (async (): Promise<boolean> => {
      try {
        setErrorCode(null)
        setState('creating')
        const created = await createAiTutorSessionRequest(lectureId, language)
        setSession(created)

        setState('connecting')
        await room.connect(created.url, created.token)

        const alreadyHasAgent = Array.from(room.remoteParticipants.values()).some(
          p => isAgentParticipantIdentity(p.identity),
        )

        if (!alreadyHasAgent) {
          await dispatchAiTutorAgentRequest(lectureId, created.roomName)
        } else {
          setAgentJoined(true)
        }

        setState('connected')
        return true
      } catch (error) {
        setState('error')
        setErrorCode(error instanceof Error ? error.message : 'AI_TUTOR_UNKNOWN_ERROR')
        try {
          await room.disconnect()
        } catch {
          /* ignore */
        }
        return false
      } finally {
        inflight.current = null
      }
    })()

    inflight.current = task
    return task
  }, [lectureId, language, room, session])

  const endSession = useCallback(async (): Promise<void> => {
    const sessionId = session?.sessionId
    setState('ending')
    try {
      await room.disconnect()
    } catch {
      /* ignore */
    }
    setAgentJoined(false)
    setSession(null)

    if (sessionId) {
      try {
        await endAiTutorSessionRequest(sessionId)
      } catch {
        /* swallow: the user has already moved on */
      }
    }
    setState('idle')
  }, [room, session?.sessionId])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session?.sessionId) {
        endAiTutorSessionWithBeacon(session.sessionId)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [session?.sessionId])

  return {
    state,
    session,
    agentJoined,
    errorCode,
    ensureConnected,
    endSession,
  }
}
