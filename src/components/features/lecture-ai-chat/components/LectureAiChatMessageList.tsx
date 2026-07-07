'use client'

import { ArrowDown } from 'lucide-react'

import { useStickToBottom } from '../hooks/useStickToBottom'
import { LectureAiChatEmptyState } from './LectureAiChatEmptyState'
import { LectureAiChatMessage } from './LectureAiChatMessage'
import type { LectureAiChatMessage as LectureAiChatMessageModel } from '../types'
import { Button } from '@/components/ui/button'

type LectureAiChatMessageListProps = {
  messages: Array<LectureAiChatMessageModel>
  isSending: boolean
  onRetry: () => void
  onSuggestion: (text: string) => void
}

export function LectureAiChatMessageList({
  messages,
  isSending,
  onRetry,
  onSuggestion,
}: LectureAiChatMessageListProps) {
  const isEmpty = messages.length === 0
  const lastContentLength = isEmpty
    ? 0
    : messages[messages.length - 1].content.length
  const { listRef, isPinned, scrollToBottom } = useStickToBottom(
    messages.length,
    lastContentLength,
  )

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={listRef}
        className="h-full overflow-y-auto overscroll-contain px-4 py-4"
      >
        {isEmpty ? (
          <LectureAiChatEmptyState onSuggestion={onSuggestion} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((message, index) => (
              <LectureAiChatMessage
                key={message.id}
                message={message}
                onRetry={onRetry}
                canRetry={index === messages.length - 1 && !isSending}
              />
            ))}
          </div>
        )}
      </div>

      {!isPinned && !isEmpty ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => scrollToBottom('smooth')}
          aria-label="Scroll to latest"
          className="absolute bottom-4 left-1/2 size-9 -translate-x-1/2 rounded-full shadow-md"
        >
          <ArrowDown className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}
