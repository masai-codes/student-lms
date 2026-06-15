import type { ReceivedMessage } from '@livekit/components-react'
import type { DisplayMessage, StoredMessage } from '@/components/features/chatbot/types'
import { filterMessagesForPersistence } from '@/components/features/chatbot/utils/persistMessages'
import {
  getMessageText,
  isUserMessage,
  messageKey,
} from '@/components/features/chatbot/utils/messages'

export function storedToDisplay(messages: StoredMessage[]): DisplayMessage[] {
  return messages.map((message) => ({
    id: message.livekitId ?? message.id,
    role: message.role,
    content: message.content,
  }))
}

export type LiveMessageDisplayMode = 'full' | 'text-chat'

function shouldIncludeLiveMessage(
  message: ReceivedMessage,
  displayMode: LiveMessageDisplayMode,
): boolean {
  if (displayMode === 'text-chat' && message.type === 'userTranscript') {
    return false
  }
  return getMessageText(message).trim().length > 0
}

function liveToDisplay(
  messages: ReceivedMessage[],
  localIdentity: string,
  displayMode: LiveMessageDisplayMode,
): DisplayMessage[] {
  const filtered = filterMessagesForPersistence(messages, localIdentity)

  return filtered
    .filter((message) => shouldIncludeLiveMessage(message, displayMode))
    .map((message, index) => ({
      id: messageKey(message, index),
      role: isUserMessage(message, localIdentity) ? 'user' : 'assistant',
      content: getMessageText(message).trim(),
    }))
}

function displayDedupeKey(message: DisplayMessage): string {
  return `${message.role}:${message.content.trim()}`
}

export function mergeDisplayMessages(
  historical: StoredMessage[],
  live: ReceivedMessage[],
  localIdentity: string,
  displayMode: LiveMessageDisplayMode = 'full',
): DisplayMessage[] {
  const stored = storedToDisplay(historical)
  const liveDisplay = liveToDisplay(live, localIdentity, displayMode)
  const liveIds = new Set(liveDisplay.map((message) => message.id))
  const liveContentKeys = new Set(liveDisplay.map(displayDedupeKey))
  const storedOnly = stored.filter(
    (message) =>
      !liveIds.has(message.id) && !liveContentKeys.has(displayDedupeKey(message)),
  )
  return [...storedOnly, ...liveDisplay]
}

