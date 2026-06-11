import {
  useAgent,
  useSessionContext,
  useSessionMessages,
  useTranscriptions,
} from '@livekit/components-react'
import { usePersistedMessages } from '@/components/features/chatbot/hooks/usePersistedMessages'
import type { DisplayMessage, StoredMessage, ChatMode } from '@/components/features/chatbot/types'
import { mergeDisplayMessages } from '@/components/features/chatbot/utils/displayMessages'
import { MessageList } from '@/components/features/chatbot/components/MessageList'
import { TextChatInput } from '@/components/features/chatbot/components/TextChatInput'
import { VoiceControls } from '@/components/features/chatbot/components/VoiceControls'

type ChatPanelProps = {
  lectureId: number
  mode: ChatMode
  sessionId: string
  historicalMessages: StoredMessage[]
  isConnecting: boolean
  isSwitchingMode: boolean
  connectionError: string | null
  onRetryConnect: () => void
}

export function ChatPanel({
  lectureId,
  mode,
  sessionId,
  historicalMessages,
  isConnecting,
  isSwitchingMode,
  connectionError,
  onRetryConnect,
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

  const displayMessages: DisplayMessage[] = mergeDisplayMessages(
    historicalMessages,
    liveMessages,
    localIdentity,
    true,
  )

  const showConnectingBanner = (isConnecting || isSwitchingMode) && !roomConnected

  return (
    <div className="chatbot-chat-panel">
      {showConnectingBanner && (
        <p className="chatbot-connecting-status" role="status">
          {isSwitchingMode ? 'Reconnecting...' : 'Connecting to your lecture assistant...'}
        </p>
      )}
      {connectionError && (
        <div className="chatbot-error-banner">
          {connectionError}
          <button
            type="button"
            className="chatbot-btn chatbot-btn-primary chatbot-btn-compact"
            onClick={onRetryConnect}
          >
            Retry connection
          </button>
        </div>
      )}
      {mode === 'voice' && roomConnected && <VoiceControls agent={agent} />}
      <MessageList
        messages={displayMessages}
        emptyLabel={
          showConnectingBanner
            ? 'Waiting for the assistant...'
            : 'Ask a question about the lecture - type or use voice.'
        }
      />
      <div className="chatbot-chat-panel-footer">
        {mode === 'text' ? (
          <TextChatInput
            agent={agent}
            send={send}
            isSending={isSending}
            isRoomConnected={roomConnected}
            isConnecting={isConnecting || isSwitchingMode}
          />
        ) : (
          roomConnected && (
            <p className="chatbot-voice-panel-hint">
              Switch to Text above to type instead of speaking.
            </p>
          )
        )}
      </div>
    </div>
  )
}

