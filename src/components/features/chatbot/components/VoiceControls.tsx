import { useCallback, useState } from 'react'
import { RoomAudioRenderer, StartAudio, useSessionContext, type useAgent } from '@livekit/components-react'
import { VoiceActivityIndicator } from '@/components/features/chatbot/components/VoiceActivityIndicator'

type VoiceControlsProps = {
  agent: ReturnType<typeof useAgent>
}

export function VoiceControls({ agent }: VoiceControlsProps) {
  const session = useSessionContext()
  const [micEnabled, setMicEnabled] = useState(true)

  const toggleMic = useCallback(async () => {
    const next = !micEnabled
    await session.room.localParticipant.setMicrophoneEnabled(next)
    setMicEnabled(next)
  }, [micEnabled, session.room.localParticipant])

  const reasons = agent.state === 'failed' && agent.failureReasons ? agent.failureReasons : null
  const failureDetail = reasons && reasons.length > 0 ? `: ${reasons.join(', ')}` : ''
  const agentFailed = agent.state === 'failed'
  const agentLabel = agentFailed ? `Agent failed${failureDetail}` : null

  return (
    <>
      <RoomAudioRenderer />
      <StartAudio label="Enable audio playback" className="chatbot-btn chatbot-btn-primary" />
      <div className="chatbot-voice-controls">
        {agentFailed ? (
          <p className="chatbot-agent-status">{agentLabel}</p>
        ) : (
          <VoiceActivityIndicator />
        )}
        <button type="button" className="chatbot-btn" onClick={toggleMic}>
          {micEnabled ? 'Mute microphone' : 'Unmute microphone'}
        </button>
      </div>
    </>
  )
}

