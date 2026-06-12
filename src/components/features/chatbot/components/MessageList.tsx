import { useEffect, useRef } from 'react'
import { ChatbotAssistantStatusBubble } from '@/components/features/chatbot/components/ChatbotAssistantStatusBubble'
import type { DisplayMessage } from '@/components/features/chatbot/types'
import { cn } from '@/lib/utils'

type MessageListProps = {
  messages: DisplayMessage[]
  emptyLabel?: string
  assistantStatusLabel?: string | null
}

export function MessageList({
  messages,
  emptyLabel = 'Waiting for messages...',
  assistantStatusLabel = null,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)


  const messageBaseClass =
    'max-w-[85%] rounded-[10px] px-2.5 py-2 text-[13px] leading-snug whitespace-pre-wrap'

  const messageClass = (role: DisplayMessage['role']) =>
    cn(
      messageBaseClass,
      role === 'user' && 'self-end bg-teal-700 text-white',
      role === 'assistant' && 'self-start bg-gray-100 text-gray-900',
    )

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {assistantStatusLabel ? (
          <ChatbotAssistantStatusBubble label={assistantStatusLabel} centered />
        ) : (
          <div className={cn(messageBaseClass, 'self-center bg-transparent text-gray-500')}>
            {emptyLabel}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {messages.map((message) => (
        <div key={message.id} className={messageClass(message.role)}>
          {message.content}
        </div>
      ))}
      {assistantStatusLabel ? (
        <ChatbotAssistantStatusBubble label={assistantStatusLabel} />
      ) : null}
      <div ref={bottomRef} />
    </div>
  )
}
