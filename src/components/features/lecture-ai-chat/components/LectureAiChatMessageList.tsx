'use client'

import { useEffect, useRef } from 'react'
import { ArrowDown } from 'lucide-react'

import { useStickToBottom } from '../hooks/useStickToBottom'
import { LectureAiChatEmptyState } from './LectureAiChatEmptyState'
import { LectureAiChatMessage } from './LectureAiChatMessage'
import type { LectureAiChatMessage as LectureAiChatMessageModel } from '../types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Scrolling counts as "stopped" once no scroll event fires for this long. */
const SCROLL_ACTIVITY_IDLE_MS = 400

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
  /**
   * Fired as the list starts/stops scrolling — scrolling counts as
   * interaction for the feedback prompt's inactivity timer, same as typing
   * (see `useLectureAiChatFeedback`).
   */
  onScrollActivityChange?: (isScrolling: boolean) => void
}

export function LectureAiChatMessageList({
  lectureId,
  messages,
  isSending,
  onRetry,
  onSuggestion,
  onSubmitPracticeQuestionAnswers,
  containScroll = false,
  onScrollActivityChange,
}: LectureAiChatMessageListProps) {
  const isEmpty = messages.length === 0
  const lastContentLength = isEmpty
    ? 0
    : messages[messages.length - 1].content.length
  const { listRef, isPinned, scrollToBottom } = useStickToBottom(
    messages.length,
    lastContentLength,
  )

  const onScrollActivityChangeRef = useRef(onScrollActivityChange)
  onScrollActivityChangeRef.current = onScrollActivityChange

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    let isScrolling = false
    let idleTimer: ReturnType<typeof setTimeout> | null = null

    const onScroll = () => {
      if (!isScrolling) {
        isScrolling = true
        onScrollActivityChangeRef.current?.(true)
      }
      if (idleTimer != null) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        isScrolling = false
        onScrollActivityChangeRef.current?.(false)
      }, SCROLL_ACTIVITY_IDLE_MS)
    }

    list.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      list.removeEventListener('scroll', onScroll)
      if (idleTimer != null) clearTimeout(idleTimer)
      // Unmounting mid-scroll (e.g. switching to chat history) must not leave
      // the feedback timer permanently suppressed.
      if (isScrolling) onScrollActivityChangeRef.current?.(false)
    }
  }, [listRef])

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={listRef}
        className={cn(
          'h-full overflow-y-auto px-2 py-4',
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
