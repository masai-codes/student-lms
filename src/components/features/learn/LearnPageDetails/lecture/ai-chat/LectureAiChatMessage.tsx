'use client'

import type { LectureChatMessage } from './constants/mockLectureChatMessages'
import { cn } from '@/lib/utils'

type LectureAiChatMessageProps = {
  message: LectureChatMessage
}

export function LectureAiChatMessage({ message }: LectureAiChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-3.5 py-2.5',
          isUser
            ? 'bg-[#6962AC] text-white'
            : 'bg-[#3a3a3a]',
        )}
      >
        <p
          className={cn(
            'type-b2-regular whitespace-pre-wrap',
            isUser ? '!text-white' : '!text-gray-100',
          )}
        >
          {message.content}
        </p>
        <p
          className={cn(
            'type-caption-regular mt-1',
            isUser ? '!text-white/70' : '!text-gray-400',
          )}
        >
          {message.createdAtLabel}
        </p>
      </div>
    </div>
  )
}
