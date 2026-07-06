'use client'

import { useState } from 'react'
import { ArrowLeft, History, Loader2, PenSquare, X } from 'lucide-react'


import { useLectureAiConversations } from '../hooks/useLectureAiConversations'
import { LectureAiChatComposer } from './LectureAiChatComposer'
import { LectureAiChatFeedbackBanner } from './LectureAiChatFeedbackBanner'
import { LectureAiChatHistoryList } from './LectureAiChatHistoryList'
import { LectureAiChatMessageList } from './LectureAiChatMessageList'
import type { UseLectureAiChatResult } from '../hooks/useLectureAiChat'
import type { UseLectureAiChatFeedbackResult } from '../hooks/useLectureAiChatFeedback'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type LectureAiChatPanelProps = {
  chat: UseLectureAiChatResult
  lectureId: number
  onClose?: () => void
  className?: string
  feedback?: UseLectureAiChatFeedbackResult
}

/**
 * The full chat surface — header (new chat / history / close), body (messages
 * or history browser), and composer. Reused by the inline experience and the
 * mobile drawer, wired to a single `useLectureAiChat` instance.
 */
export function LectureAiChatPanel({
  chat,
  lectureId,
  onClose,
  className,
  feedback,
}: LectureAiChatPanelProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const conversations = useLectureAiConversations(lectureId, isHistoryOpen)

  const hasMessages = chat.messages.length > 0

  const handleSelectConversation = (chatId: number) => {
    setIsHistoryOpen(false)
    void chat.selectConversation(chatId)
  }

  const handleNewChat = () => {
    setIsHistoryOpen(false)
    chat.startNewChat()
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-col bg-background',
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        {isHistoryOpen ? (
          <button
            type="button"
            onClick={() => setIsHistoryOpen(false)}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
          >
            <ArrowLeft className="size-4" />
            Chat history
          </button>
        ) : (
          <span className="text-sm font-semibold text-foreground">
            AI Tutor
          </span>
        )}

        <div className="flex items-center gap-1">
          {hasMessages || isHistoryOpen ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNewChat}
              aria-label="New chat"
            >
              <PenSquare className="size-4" />
            </Button>
          ) : null}

          {!isHistoryOpen ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsHistoryOpen(true)}
              aria-label="Chat history"
            >
              <History className="size-4" />
            </Button>
          ) : null}

          {onClose ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close chat"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </header>

      {isHistoryOpen ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <LectureAiChatHistoryList
            conversations={conversations.data?.conversations ?? []}
            activeChatId={chat.activeChatId}
            isLoading={conversations.isLoading}
            isError={conversations.isError}
            onSelect={handleSelectConversation}
          />
        </div>
      ) : chat.isLoadingConversation ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <LectureAiChatMessageList
          messages={chat.messages}
          isSending={chat.isSending}
          onRetry={chat.retryLast}
          onSuggestion={(text) => chat.sendMessage(text)}
        />
      )}

      {!isHistoryOpen && feedback?.isVisible ? (
        <LectureAiChatFeedbackBanner
          isSubmitting={feedback.isSubmitting}
          submitError={feedback.submitError}
          onSubmit={feedback.submit}
          onDismiss={feedback.skip}
          className="mb-2 mt-2 shrink-0 px-2"
        />
      ) : null}

      {!isHistoryOpen ? (
        <LectureAiChatComposer
          value={chat.input}
          onChange={chat.setInput}
          onSend={() => chat.sendMessage()}
          onStop={chat.stop}
          isSending={chat.isSending}
        />
      ) : null}
    </div>
  )
}
