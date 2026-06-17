import type { DisplayMessage } from '@/components/features/chatbot/types'
import { ChatbotAssistantMessage } from '@/components/features/chatbot/components/ChatbotAssistantMessage'
import { ChatbotAssistantStatusBubble } from '@/components/features/chatbot/components/ChatbotAssistantStatusBubble'
import { ChatbotUserMessage } from '@/components/features/chatbot/components/ChatbotUserMessage'
import { useChatTurnScroll } from '@/components/features/chatbot/hooks/useChatTurnScroll'
import { cn } from '@/lib/utils'

type MessageListProps = {
  messages: Array<DisplayMessage>
  emptyLabel?: string
  assistantStatusLabel?: string | null
}

const messageBaseClass =
  'max-w-[85%] rounded-[10px] px-2.5 py-2 text-[13px] leading-snug whitespace-pre-wrap'

export function MessageList({
  messages,
  emptyLabel = 'Waiting for messages...',
  assistantStatusLabel = null,
}: MessageListProps) {
  const {
    scrollContainerRef,
    spacerHeightPx,
    userMessageMaxHeightPx,
    latestUserMessageId,
  } = useChatTurnScroll(messages)

  if (messages.length === 0) {
    return (
      <div
        ref={scrollContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto scroll-smooth"
      >
        {assistantStatusLabel ? (
          <ChatbotAssistantStatusBubble label={assistantStatusLabel} centered />
        ) : (
          <div className={cn(messageBaseClass, 'self-center bg-transparent text-gray-500')}>
            {emptyLabel}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto scroll-smooth"
    >
      {messages.map((message) =>
        message.role === 'user' ? (
          <ChatbotUserMessage
            key={message.id}
            message={message}
            maxHeightPx={userMessageMaxHeightPx}
            isLatest={message.id === latestUserMessageId}
          />
        ) : (
          <ChatbotAssistantMessage key={message.id} content={message.content} />
        ),
      )}
      {assistantStatusLabel ? (
        <ChatbotAssistantStatusBubble label={assistantStatusLabel} />
      ) : null}
      <div aria-hidden style={{ minHeight: spacerHeightPx, flexShrink: 0 }} />
    </div>
  )
}
