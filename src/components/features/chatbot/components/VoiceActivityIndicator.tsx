import { useMemo } from 'react'
import {
  BarVisualizer,
  useIsSpeaking,
  useLocalParticipant,
  useVoiceAssistant,
} from '@livekit/components-react'
import type { AgentState } from '@livekit/components-react'

function activityLabel(state: AgentState, userSpeaking: boolean): string {
  switch (state) {
    case 'speaking':
      return 'Assistant speaking'
    case 'thinking':
      return 'Thinking...'
    case 'listening':
      return userSpeaking ? 'Listening to you...' : 'Listening...'
    case 'initializing':
    case 'pre-connect-buffering':
    case 'connecting':
      return 'Connecting...'
    case 'idle':
      return 'Ready'
    default:
      return 'Voice'
  }
}

export function VoiceActivityIndicator() {
  const { state, audioTrack } = useVoiceAssistant()
  const { localParticipant } = useLocalParticipant()
  const userSpeaking = useIsSpeaking(localParticipant)
  const label = useMemo(() => activityLabel(state, userSpeaking), [state, userSpeaking])

  return (
    <div className="chatbot-voice-activity" role="status" aria-live="polite" aria-label={label}>
      <div className="chatbot-voice-activity-visual" aria-hidden>
        <BarVisualizer
          state={state}
          trackRef={audioTrack}
          barCount={5}
          className="chatbot-voice-activity-bars"
        />
      </div>
      <p className="chatbot-voice-activity-label">{label}</p>
    </div>
  )
}

