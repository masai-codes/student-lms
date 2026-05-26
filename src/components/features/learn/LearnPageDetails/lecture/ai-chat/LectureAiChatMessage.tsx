'use client'

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { formatChatTimestamp } from './utils/mergeChatMessages'
import type { LectureChatMessage } from './types'

import { cn } from '@/lib/utils'

type LectureAiChatMessageProps = {
  message: LectureChatMessage
}

export function LectureAiChatMessage({ message }: LectureAiChatMessageProps) {
  const isUser = message.role === 'user'
  const timestampLabel = formatChatTimestamp(message.timestamp)

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-3.5 py-2.5',
          isUser ? 'bg-[#6962AC] text-white' : 'bg-[#3a3a3a]',
        )}
      >
        <div
          className={cn(
            'type-b2-regular ai-chat-markdown whitespace-pre-wrap break-words',
            isUser ? '!text-white' : '!text-gray-100',
          )}
        >
          <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
        </div>
        {timestampLabel ? (
          <p
            className={cn(
              'type-caption-regular mt-1',
              isUser ? '!text-white/70' : '!text-gray-400',
            )}
          >
            {timestampLabel}
          </p>
        ) : null}
      </div>
    </div>
  )
}
