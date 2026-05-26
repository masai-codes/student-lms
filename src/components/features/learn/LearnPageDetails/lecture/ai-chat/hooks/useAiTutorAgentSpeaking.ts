'use client'

import { useRoomContext } from '@livekit/components-react'
import { RoomEvent } from 'livekit-client'
import { useEffect, useState } from 'react'
import type { Participant } from 'livekit-client'

function isAgentParticipant(participant: Participant): boolean {
  const identity = participant.identity.toLowerCase()
  return identity.includes('agent') || identity.includes('tutor')
}

/**
 * `true` while a remote agent participant is in the active speakers list.
 * Used to highlight the chat panel when the AI Tutor is speaking back.
 */
export function useAiTutorAgentSpeaking(): boolean {
  const room = useRoomContext()
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    const handleSpeakers = (speakers: Array<Participant>) => {
      setIsSpeaking(speakers.some(isAgentParticipant))
    }

    room.on(RoomEvent.ActiveSpeakersChanged, handleSpeakers)
    handleSpeakers(room.activeSpeakers)

    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, handleSpeakers)
    }
  }, [room])

  return isSpeaking
}
