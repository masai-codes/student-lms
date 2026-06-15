import type { ReceivedMessage } from '@livekit/components-react'

export function getMessageText(message: ReceivedMessage): string {
  if (message.type === 'chatMessage') {
    return message.message
  }
  if (message.type === 'userTranscript' || message.type === 'agentTranscript') {
    return message.message
  }
  return ''
}

export function isUserMessage(message: ReceivedMessage, localIdentity: string): boolean {
  if (message.type === 'userTranscript') {
    return true
  }
  if (message.type === 'agentTranscript') {
    return false
  }
  if (message.type === 'chatMessage') {
    return message.from?.identity === localIdentity
  }
  return false
}

export function messageKey(message: ReceivedMessage, index: number): string {
  return message.id ?? `${message.type}-${message.timestamp}-${index}`
}

