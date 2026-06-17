import { useCallback, useEffect, useState } from 'react'
import { useLocalParticipant, useSessionContext } from '@livekit/components-react'
import { Microphone, MicrophoneSlash, X } from '@phosphor-icons/react'
import { AIAvatar } from '@/components/common/AIAvatar'

type ChatbotVoiceControlsProps = {
  isSpeaking: boolean
  isConnecting: boolean
  onEndSession: () => void
}

const actionBtnClass =
  'flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-gray-100 text-gray-700 transition-opacity disabled:cursor-not-allowed disabled:opacity-45'

export function ChatbotVoiceControls({
  isSpeaking,
  isConnecting,
  onEndSession,
}: ChatbotVoiceControlsProps) {
  const session = useSessionContext()
  const { localParticipant } = useLocalParticipant()
  const [micEnabled, setMicEnabled] = useState(true)

  useEffect(() => {
    setMicEnabled(localParticipant.isMicrophoneEnabled)
  }, [localParticipant.isMicrophoneEnabled])

  const toggleMic = useCallback(async () => {
    const next = !micEnabled
    await session.room.localParticipant.setMicrophoneEnabled(next)
    setMicEnabled(next)
  }, [micEnabled, session.room.localParticipant])

  return (
    <div className="flex flex-col items-center gap-3 py-2" aria-label="Voice assistant controls">
      <AIAvatar className="size-20" isSpeaking={isSpeaking} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={actionBtnClass}
          onClick={onEndSession}
          disabled={isConnecting}
          aria-label="End voice session"
        >
          <X className="size-[18px]" weight="bold" />
        </button>
        <button
          type="button"
          className={actionBtnClass}
          onClick={() => void toggleMic()}
          disabled={isConnecting}
          aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
          aria-pressed={micEnabled}
        >
          {micEnabled ? (
            <Microphone className="size-[18px]" weight="bold" />
          ) : (
            <MicrophoneSlash className="size-[18px]" weight="bold" />
          )}
        </button>
      </div>
    </div>
  )
}
