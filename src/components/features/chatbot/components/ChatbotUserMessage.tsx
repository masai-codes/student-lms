import type { Ref } from 'react'
import type { DisplayMessage } from '@/components/features/chatbot/types'
import { CHAT_USER_MESSAGE_ATTR } from '@/components/features/chatbot/utils/chatScroll'
import { cn } from '@/lib/utils'

type ChatbotUserMessageProps = {
  message: DisplayMessage
  maxHeightPx: number
  isLatest: boolean
  messageRef?: Ref<HTMLDivElement>
}

const messageBaseClass =
  'max-w-[85%] rounded-[10px] px-2.5 py-2 text-[13px] leading-snug whitespace-pre-wrap'

export function ChatbotUserMessage({
  message,
  maxHeightPx,
  isLatest,
  messageRef,
}: ChatbotUserMessageProps) {
  const clipStyle =
    isLatest && maxHeightPx > 0
      ? {
          maxHeight: maxHeightPx,
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }
      : undefined

  return (
    <div
      ref={messageRef}
      {...{ [CHAT_USER_MESSAGE_ATTR]: message.id }}
      className={cn(messageBaseClass, 'self-end bg-teal-700 text-white')}
    >
      <div style={clipStyle}>{message.content}</div>
    </div>
  )
}
