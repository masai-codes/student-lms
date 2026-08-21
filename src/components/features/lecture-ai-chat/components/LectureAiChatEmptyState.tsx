'use client'

import { BookOpen, ListChecks, NotebookText, Sparkles } from 'lucide-react'

import { useLectureAiChatSuggestions } from '../hooks/useLectureAiChatSuggestions'
import type { LectureAiChatSuggestionIcon } from '@/lib/api/cache/lectureAiChatSuggestionsApi'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'
import { Button } from '@/components/ui/button'

type LectureAiChatEmptyStateProps = {
  lectureId: number
  onSuggestion: (text: string) => void
}

const SUGGESTION_ICONS: Record<
  Exclude<LectureAiChatSuggestionIcon, 'faq'>,
  typeof Sparkles
> = {
  summary: NotebookText,
  explain: BookOpen,
  quiz: ListChecks,
}

function FaqIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold leading-none text-primary"
    >
      ?
    </span>
  )
}

export function LectureAiChatEmptyState({
  lectureId,
  onSuggestion,
}: LectureAiChatEmptyStateProps) {
  const suggestionsQuery = useLectureAiChatSuggestions(lectureId)
  const suggestions = suggestionsQuery.data?.suggestions ?? []

  const handleSuggestionClick = (
    icon: LectureAiChatSuggestionIcon,
    question: string,
  ) => {
    if (icon === 'faq') {
      pushLearnEvent(
        learnEntityEvent('lecture', 'ai_chat_faq_click', lectureId),
        { question },
      )
    }
    onSuggestion(question)
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col py-6 text-center">
      <div className="my-auto flex w-full flex-col items-center gap-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">
            Ask about this lecture
          </h3>
          <p className="text-sm text-muted-foreground">
            Get instant help with concepts, summaries, and doubts from this
            lecture.
          </p>
        </div>

        <div
          className="flex w-full flex-col gap-2"
          data-testid="lecture-ai-chat-suggestions"
        >
          {suggestions.map((suggestion) => {
            const isFaq = suggestion.icon === 'faq'
            const Icon =
              suggestion.icon === 'faq'
                ? null
                : SUGGESTION_ICONS[suggestion.icon]
            return (
              <Button
                key={`${suggestion.icon}-${suggestion.question}`}
                type="button"
                variant="outline"
                data-testid={
                  isFaq
                    ? 'lecture-ai-chat-faq-suggestion'
                    : 'lecture-ai-chat-suggestion'
                }
                className="h-auto w-full justify-start gap-2 whitespace-normal px-3.5 py-2.5 text-left text-sm font-normal"
                onClick={() =>
                  handleSuggestionClick(suggestion.icon, suggestion.question)
                }
              >
                {isFaq ? (
                  <FaqIcon />
                ) : (
                  Icon && (
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                  )
                )}
                {suggestion.question}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
