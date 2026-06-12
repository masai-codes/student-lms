import type { DisplayMessage } from '@/components/features/chatbot/types'

export function appendOptimisticMessages(
  messages: DisplayMessage[],
  optimisticMessages: DisplayMessage[],
): DisplayMessage[] {
  if (optimisticMessages.length === 0) {
    return messages
  }

  const existingUserContents = new Set(
    messages.filter((message) => message.role === 'user').map((message) => message.content),
  )

  const pending = optimisticMessages.filter(
    (message) => !existingUserContents.has(message.content),
  )

  if (pending.length === 0) {
    return messages
  }

  return [...messages, ...pending]
}
