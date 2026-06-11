import { useEffect, useRef } from 'react'
import type { DisplayMessage } from '@/components/features/chatbot/types'

type MessageListProps = {
  messages: DisplayMessage[]
  emptyLabel?: string
}

export function MessageList({
  messages,
  emptyLabel = 'Waiting for messages...',
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="chatbot-messages">
        <div className="chatbot-message chatbot-message-system">{emptyLabel}</div>
        <div ref={bottomRef} />
      </div>
    )
  }

  return (
    <div className="chatbot-messages">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`chatbot-message ${message.role === 'user' ? 'chatbot-message-user' : 'chatbot-message-assistant'}`}
        >
          {message.content}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

