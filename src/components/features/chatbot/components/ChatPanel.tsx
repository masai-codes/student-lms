import {
  useAgent,
  useSessionContext,
  useSessionMessages,
  useTranscriptions,
} from '@livekit/components-react'
import { useMemo } from 'react'
import { usePersistedMessages } from '@/components/features/chatbot/hooks/usePersistedMessages'
import type { DisplayMessage, StoredMessage, ChatMode } from '@/components/features/chatbot/types'
import { getAssistantStatusLabel } from '@/components/features/chatbot/utils/assistantStatus'
import { mergeDisplayMessages } from '@/components/features/chatbot/utils/displayMessages'
import { appendOptimisticMessages } from '@/components/features/chatbot/utils/optimisticMessages'
import { selectVoiceSubtitle } from '@/components/features/chatbot/utils/voiceSubtitle'
import { ChatbotConversationLayout } from '@/components/features/chatbot/components/ChatbotConversationLayout'
import { ChatbotVoiceModeView } from '@/components/features/chatbot/components/ChatbotVoiceModeView'
import { TextChatInput } from '@/components/features/chatbot/components/TextChatInput'
import {
  chatbotBtnPrimaryClass,
  chatbotErrorBannerClass,
} from '@/components/features/chatbot/chatbotUi'
import { cn } from '@/lib/utils'

type ChatPanelProps = {
  lectureId: number
  mode: ChatMode
  sessionId: string
  historicalMessages: StoredMessage[]
  optimisticMessages?: DisplayMessage[]
  isConnecting: boolean
  isSwitchingMode: boolean
  connectionError: string | null
  onRetryConnect: () => void
  pendingMessage?: string | null
  onPendingMessageSent?: () => void
  onVoiceModeToggle?: () => void | Promise<void>
}

export function ChatPanel({
  lectureId,
  mode,
  sessionId,
  historicalMessages,
  optimisticMessages = [],
  isConnecting,
  isSwitchingMode,
  connectionError,
  onRetryConnect,
  pendingMessage,
  onPendingMessageSent,
  onVoiceModeToggle,
}: ChatPanelProps) {
  const session = useSessionContext()
  const agent = useAgent(session)
  const { messages: liveMessages, send, isSending } = useSessionMessages(session)
  const transcriptions = useTranscriptions({ room: session.room })
  const localIdentity = session.room.localParticipant.identity
  const roomConnected = session.isConnected

  usePersistedMessages(
    lectureId,
    sessionId,
    liveMessages,
    transcriptions,
    localIdentity,
    roomConnected,
  )

  const displayMessages: DisplayMessage[] = appendOptimisticMessages(
    mergeDisplayMessages(historicalMessages, liveMessages, localIdentity, 'text-chat'),
    optimisticMessages,
  )

  const voiceSubtitle = useMemo(() => {
    const voiceMessages = appendOptimisticMessages(
      mergeDisplayMessages(historicalMessages, liveMessages, localIdentity, 'full'),
      optimisticMessages,
    )
    return selectVoiceSubtitle(voiceMessages)
  }, [historicalMessages, liveMessages, localIdentity, optimisticMessages])

  const agentReady =
    agent.state === 'listening' ||
    agent.state === 'thinking' ||
    agent.state === 'speaking' ||
    agent.state === 'idle' ||
    agent.state === 'initializing'

  const lastMessageRole = displayMessages.at(-1)?.role
  const hasUserTurn =
    displayMessages.some((message) => message.role === 'user') || Boolean(pendingMessage)

  const assistantStatusLabel = useMemo(
    () =>
      getAssistantStatusLabel({
        hasUserTurn,
        isConnecting: isConnecting || isSwitchingMode,
        roomConnected,
        agentReady,
        pendingMessage: Boolean(pendingMessage),
        isSending,
        agentThinking: agent.state === 'thinking',
        lastMessageRole,
      }),
    [
      agent.state,
      agentReady,
      hasUserTurn,
      isConnecting,
      isSending,
      isSwitchingMode,
      lastMessageRole,
      pendingMessage,
      roomConnected,
    ],
  )

  const isWaitingToConnect =
    (isConnecting || isSwitchingMode) && !roomConnected && !hasUserTurn

  if (mode === 'voice') {
    return (
      <ChatbotVoiceModeView
        agent={agent}
        subtitle={voiceSubtitle}
        isConnecting={isConnecting || isSwitchingMode}
        connectionError={connectionError}
        onRetryConnect={onRetryConnect}
        onSwitchToText={() => void onVoiceModeToggle?.()}
      />
    )
  }

  const banner = (
    <>
      {connectionError && (
        <div className={cn(chatbotErrorBannerClass, 'mb-2')}>
          {connectionError}
          <button
            type="button"
            className={cn(chatbotBtnPrimaryClass, 'mt-1.5')}
            onClick={onRetryConnect}
          >
            Retry connection
          </button>
        </div>
      )}
    </>
  )

  const composer = (
    <TextChatInput
      agent={agent}
      send={send}
      isSending={isSending}
      isRoomConnected={roomConnected}
      isConnecting={isConnecting || isSwitchingMode}
      pendingMessage={pendingMessage}
      onPendingMessageSent={onPendingMessageSent}
      isVoiceActive={false}
      onVoiceActivate={() => void onVoiceModeToggle?.()}
    />
  )

  return (
    <>
      {banner}
      <ChatbotConversationLayout
        messages={displayMessages}
        emptyLabel="Ask a question about the lecture."
        assistantStatusLabel={
          assistantStatusLabel ??
          (isWaitingToConnect ? 'Connecting to assistant...' : null)
        }
        composer={composer}
      />
    </>
  )
}
