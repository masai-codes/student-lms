'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  PenSquare,
  X,
} from 'lucide-react'

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
  /** Focus the composer when this panel mounts (used by the mobile drawer). */
  autoFocusComposer?: boolean
  /**
   * Trap message-list scroll at its edges instead of chaining to the page.
   * Enabled for the mobile drawer so the page behind it stays put; left off for
   * the desktop sidebar so a barely-scrollable list still lets the page scroll.
   */
  containScroll?: boolean
  /**
   * Portal target for the composer's language menu. The mobile drawer passes
   * its content node so the menu renders inside the drawer instead of `<body>`,
   * keeping the drawer open when a language is picked.
   */
  languageMenuContainer?: HTMLElement | null
  /** Fired when the composer's language menu opens/closes (see the picker). */
  onLanguageMenuOpenChange?: (open: boolean) => void
  /** Whether the floating popup is maximized (used by the desktop floating chat). */
  isExpanded?: boolean
  /** When provided, renders a maximize/minimize control in the header. */
  onToggleExpand?: () => void
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
  autoFocusComposer,
  containScroll,
  languageMenuContainer,
  onLanguageMenuOpenChange,
  isExpanded,
  onToggleExpand,
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

          {onToggleExpand ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleExpand}
              data-testid="lecture-ask-ai-expand-toggle"
              aria-label={isExpanded ? 'Minimize chat' : 'Maximize chat'}
              aria-pressed={isExpanded}
            >
              {isExpanded ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
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
          containScroll={containScroll}
        />
      )}

      {!isHistoryOpen && feedback?.isVisible ? (
        // Match the composer's horizontal gutter (px-4) so the card lines up
        // with it instead of bleeding to the panel edges.
        <div className="shrink-0 px-4 pb-1 pt-2">
          <LectureAiChatFeedbackBanner
            isSubmitting={feedback.isSubmitting}
            submitError={feedback.submitError}
            onSubmit={feedback.submit}
            onDismiss={feedback.skip}
          />
        </div>
      ) : null}

      {!isHistoryOpen ? (
        <LectureAiChatComposer
          value={chat.input}
          onChange={chat.setInput}
          onSend={() => chat.sendMessage()}
          onStop={chat.stop}
          isSending={chat.isSending}
          language={chat.language}
          onLanguageChange={chat.setLanguage}
          autoFocus={autoFocusComposer}
          languageMenuContainer={languageMenuContainer}
          onLanguageMenuOpenChange={onLanguageMenuOpenChange}
        />
      ) : null}
    </div>
  )
}
