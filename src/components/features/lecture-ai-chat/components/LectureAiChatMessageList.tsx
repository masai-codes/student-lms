'use client'

import { ArrowDown } from 'lucide-react'

import { useStickToBottom } from '../hooks/useStickToBottom'
import { LectureAiChatEmptyState } from './LectureAiChatEmptyState'
import { LectureAiChatMessage } from './LectureAiChatMessage'
import type { LectureAiChatMessage as LectureAiChatMessageModel } from '../types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LectureAiChatMessageListProps = {
  lectureId: number
  messages: Array<LectureAiChatMessageModel>
  isSending: boolean
  onRetry: () => void
  onSuggestion: (text: string) => void
  onSubmitPracticeQuestionAnswers: (
    messageId: string,
    quizId: string,
    answers: Record<string, string>,
  ) => void
  /**
   * Trap wheel/touch scroll inside the list even at its top/bottom edge. Wanted
   * for the mobile drawer (so the page behind it stays put), but not for the
   * desktop sidebar — there, when the list has little/nothing to scroll the
   * wheel should chain to the page as usual.
   */
  containScroll?: boolean
}

export function LectureAiChatMessageList({
  lectureId,
  messages,
  isSending,
  onRetry,
  onSuggestion,
  onSubmitPracticeQuestionAnswers,
  containScroll = false,
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
        className={cn(
          'h-full overflow-y-auto px-4 py-4',
          containScroll ? 'overscroll-contain' : 'overscroll-auto',
        )}
      >
        {isEmpty ? (
          <LectureAiChatEmptyState
            lectureId={lectureId}
            onSuggestion={onSuggestion}
          />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((message, index) => (
              <LectureAiChatMessage
                key={message.id}
                message={message}
                onRetry={onRetry}
                canRetry={index === messages.length - 1 && !isSending}
                onSubmitPracticeQuestionAnswers={
                  onSubmitPracticeQuestionAnswers
                }
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
