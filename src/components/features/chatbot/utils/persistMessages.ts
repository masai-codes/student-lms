import type { ReceivedMessage } from '@livekit/components-react'
import { getMessageText, isUserMessage } from '@/components/features/chatbot/utils/messages'

export type PersistPayload = {
  role: 'user' | 'assistant'
  content: string
  sourceType: string
  livekitId: string | null
}

export function toPersistPayload(
  message: ReceivedMessage,
  localIdentity: string,
): PersistPayload | null {
  const content = getMessageText(message).trim()
  if (!content) {
    return null
  }

  if (message.type === 'userTranscript') {
    return { role: 'user', content, sourceType: message.type, livekitId: message.id ?? null }
  }

  if (message.type === 'agentTranscript') {
    return {
      role: 'assistant',
      content,
      sourceType: message.type,
      livekitId: message.id ?? null,
    }
  }

  if (message.type === 'chatMessage') {
    const role = isUserMessage(message, localIdentity) ? 'user' : 'assistant'
    return { role, content, sourceType: message.type, livekitId: message.id ?? null }
  }

  return null
}

export function filterMessagesForPersistence(
  messages: ReceivedMessage[],
  localIdentity: string,
): ReceivedMessage[] {
  const chatUserTexts = new Set<string>()
  for (const message of messages) {
    if (message.type === 'chatMessage' && isUserMessage(message, localIdentity)) {
      const text = getMessageText(message).trim()
      if (text) {
        chatUserTexts.add(text)
      }
    }
  }

  return messages.filter((message) => {
    if (message.type !== 'userTranscript') {
      return true
    }
    const text = getMessageText(message).trim()
    if (!text) {
      return false
    }
    return !chatUserTexts.has(text)
  })
}

