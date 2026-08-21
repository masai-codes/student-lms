'use client'

import { ArrowUp, Square } from 'lucide-react'
import { LECTURE_AI_CHAT_MAX_MESSAGE_LENGTH } from '../constants'
import { LectureAiChatLanguagePicker } from './LectureAiChatLanguagePicker'
import type { AiLectureChatLanguage } from '../languages'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type LectureAiChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isSending: boolean
  language: AiLectureChatLanguage
  onLanguageChange: (language: AiLectureChatLanguage) => void
  platform?: 'mobile' | 'desktop'
  onFocus?: () => void
  autoFocus?: boolean
  /**
   * Render the textarea as a non-editable launcher: it can be focused/tapped
   * (firing `onFocus`) but never opens the mobile keyboard. Used by the mobile
   * dock so the keyboard-driving input lives inside the drawer instead.
   */
  readOnly?: boolean
  /**
   * Portal target for the language menu. Set to the drawer content node on
   * mobile so the menu renders inside the drawer and picking a language doesn't
   * dismiss it. Omit on desktop to portal to `<body>` as usual.
   */
  languageMenuContainer?: HTMLElement | null
  /** Fired when the language menu opens/closes (see the picker's `onOpenChange`). */
  onLanguageMenuOpenChange?: (open: boolean) => void
}

export function LectureAiChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  isSending,
  language,
  onLanguageChange,
  platform = 'desktop',
  onFocus,
  autoFocus,
  readOnly = false,
  languageMenuContainer,
  onLanguageMenuOpenChange,
}: LectureAiChatComposerProps) {
  const canSend = value.trim().length > 0 && !isSending && !readOnly

  return (
    <div
      className={cn(
        'shrink-0 border-t border-border bg-background pt-3',
        platform === 'mobile' ? 'px-0' : 'px-1',
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-input bg-background p-2 shadow-sm transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <Textarea
          value={value}
          autoFocus={autoFocus}
          onFocus={onFocus}
          readOnly={readOnly}
          onChange={(event) =>
            onChange(
              event.target.value.slice(0, LECTURE_AI_CHAT_MAX_MESSAGE_LENGTH),
            )
          }
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.shiftKey) return
            event.preventDefault()
            if (canSend) onSend()
          }}
          rows={1}
          placeholder="Ask anything about this lecture…"
          aria-label="Ask the AI tutor"
          className="max-h-40 min-h-0 resize-none overflow-y-auto border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:border-0 focus-visible:ring-0"
        />

        <div className="flex items-center justify-between gap-2 px-1">
          <LectureAiChatLanguagePicker
            value={language}
            onChange={onLanguageChange}
            disabled={isSending}
            container={languageMenuContainer}
            onOpenChange={onLanguageMenuOpenChange}
          />

          {isSending ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={onStop}
              aria-label="Stop generating"
              className="rounded-full"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send message"
              className="rounded-full"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="text-[10px] text-center text-foreground-muted">
        AI tutor can make mistakes. Please double-check responses.
      </div>
    </div>
  )
}
