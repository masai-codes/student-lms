import { useCallback, useEffect, useState } from 'react'
import {
  RoomAudioRenderer,
  StartAudio,
  useIsSpeaking,
  useLocalParticipant,
  useSessionContext,
  useVoiceAssistant,
  type useAgent,
} from '@livekit/components-react'
import type { TextStreamData } from '@livekit/components-core'
import { ChatsCircle, Microphone, MicrophoneSlash } from '@phosphor-icons/react'
import { AIAvatar } from '@/components/common/AIAvatar'
import { ChatbotVoiceSubtitle } from '@/components/features/chatbot/components/ChatbotVoiceSubtitle'
import { useVoiceSubtitle } from '@/components/features/chatbot/hooks/useVoiceSubtitle'
import {
  chatbotBtnPrimaryClass,
  chatbotErrorBannerClass,
  chatbotMutedTextClass,
} from '@/components/features/chatbot/chatbotUi'
import { MasaiButton } from '@/components/ui/masai-button'
import { cn } from '@/lib/utils'

type ChatbotVoiceModeViewProps = {
  agent: ReturnType<typeof useAgent>
  transcriptions: TextStreamData[]
  isConnecting: boolean
  connectionError: string | null
  onRetryConnect: () => void
  onSwitchToText: () => void | Promise<void>
}

export function ChatbotVoiceModeView({
  agent,
  transcriptions,
  isConnecting,
  connectionError,
  onRetryConnect,
  onSwitchToText,
}: ChatbotVoiceModeViewProps) {
  const session = useSessionContext()
  const { localParticipant } = useLocalParticipant()
  const { state: agentState } = useVoiceAssistant()
  const userSpeaking = useIsSpeaking(localParticipant)
  const agentSpeaking = agentState === 'speaking'
  const [micEnabled, setMicEnabled] = useState(true)

  const subtitle = useVoiceSubtitle(
    transcriptions,
    session.room.localParticipant.identity,
    userSpeaking,
    agentSpeaking,
  )

  useEffect(() => {
    setMicEnabled(localParticipant.isMicrophoneEnabled)
  }, [localParticipant.isMicrophoneEnabled])

  const toggleMic = useCallback(async () => {
    const next = !micEnabled
    await session.room.localParticipant.setMicrophoneEnabled(next)
    setMicEnabled(next)
  }, [micEnabled, session.room.localParticipant])

  const isLive = userSpeaking || agentSpeaking || agentState === 'listening'
  const agentFailed = agent.state === 'failed'
  const failureReasons =
    agentFailed && agent.failureReasons && agent.failureReasons.length > 0
      ? agent.failureReasons.join(', ')
      : null

  const statusLabel = isConnecting
    ? 'Connecting to assistant...'
    : agentFailed
      ? `Assistant unavailable${failureReasons ? `: ${failureReasons}` : ''}`
      : agentState === 'thinking'
        ? 'Thinking...'
        : null

  return (
    <section
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        'p-2',
      )}
      aria-label="Voice assistant"
    >
      {connectionError ? (
        <div className={cn(chatbotErrorBannerClass, 'mb-2 shrink-0')}>
          {connectionError}
          <button
            type="button"
            className={cn(chatbotBtnPrimaryClass, 'mt-1.5')}
            onClick={onRetryConnect}
          >
            Retry connection
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            className={cn(
              'transition-transform duration-500 ease-out',
              isLive && 'scale-[1.03]',
              agentSpeaking && 'scale-[1.05]',
            )}
          >
            <AIAvatar />
          </div>

          <div className="flex items-center justify-center gap-2">
            <MasaiButton
              type="tertiary"
              size="sm"
              iconOnly
              icon={micEnabled ? <Microphone weight="bold" /> : <MicrophoneSlash weight="bold" />}
              aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              aria-pressed={micEnabled}
              onClick={() => void toggleMic()}
              disabled={isConnecting}
            />
            <MasaiButton
              type="secondary"
              size="sm"
              iconOnly
              icon={<ChatsCircle weight="bold" />}
              aria-label="Switch to text chat"
              onClick={() => void onSwitchToText()}
              disabled={isConnecting}
            />
          </div>

          {statusLabel ? (
            <p className={cn('m-0 text-center type-b2-md', chatbotMutedTextClass)} role="status">
              {statusLabel}
            </p>
          ) : null}
        </div>

        <ChatbotVoiceSubtitle subtitle={subtitle} />
      </div>

      <RoomAudioRenderer />
      <StartAudio label="Enable audio playback" className={chatbotBtnPrimaryClass} />
    </section>
  )
}
