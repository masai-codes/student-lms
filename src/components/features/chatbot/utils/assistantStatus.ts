import type { DisplayMessage } from '@/components/features/chatbot/types'

export type AssistantStatusInput = {
  hasUserTurn: boolean
  isConnecting: boolean
  roomConnected: boolean
  agentReady: boolean
  pendingMessage: boolean
  isSending: boolean
  agentThinking: boolean
  lastMessageRole?: DisplayMessage['role']
}

export function getAssistantStatusLabel(input: AssistantStatusInput): string | null {
  if (!input.hasUserTurn) {
    return null
  }

  const {
    isConnecting,
    roomConnected,
    agentReady,
    pendingMessage,
    isSending,
    agentThinking,
    lastMessageRole,
  } = input

  if (isConnecting || !roomConnected) {
    return 'Connecting to assistant...'
  }

  if (!agentReady) {
    return 'Starting assistant...'
  }

  if (pendingMessage) {
    return 'Sending...'
  }

  const awaitingReply =
    lastMessageRole === 'user' ||
    isSending ||
    (agentThinking && lastMessageRole !== 'assistant')

  if (!awaitingReply) {
    return null
  }

  return 'Thinking...'
}
