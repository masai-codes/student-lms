'use client'

import { BookOpen, ListChecks, NotebookText, Sparkles } from 'lucide-react'

import { useLectureAiChatFaqs } from '../hooks/useLectureAiChatFaqs'
import { LECTURE_AI_CHAT_SUGGESTIONS } from '../constants'
import type { LectureAiChatSuggestionKind } from '../constants'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'
import { Button } from '@/components/ui/button'

type LectureAiChatEmptyStateProps = {
  lectureId: number
  onSuggestion: (text: string) => void
}

const SUGGESTION_ICONS: Record<LectureAiChatSuggestionKind, typeof Sparkles> = {
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
  const faqsQuery = useLectureAiChatFaqs(lectureId)
  const faqs = faqsQuery.data?.faqs ?? []

  const handleFaqClick = (question: string) => {
    pushLearnEvent(
      learnEntityEvent('lecture', 'ai_chat_faq_click', lectureId),
      { question },
    )
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
          {faqs.map((faq) => (
            <Button
              key={faq.question}
              type="button"
              variant="outline"
              data-testid="lecture-ai-chat-faq-suggestion"
              className="h-auto w-full justify-start gap-2 whitespace-normal px-3.5 py-2.5 text-left text-sm font-normal"
              onClick={() => handleFaqClick(faq.question)}
            >
              <FaqIcon />
              {faq.question}
            </Button>
          ))}

          {LECTURE_AI_CHAT_SUGGESTIONS.map((suggestion) => {
            const Icon = SUGGESTION_ICONS[suggestion.kind]
            return (
              <Button
                key={suggestion.kind}
                type="button"
                variant="outline"
                data-testid="lecture-ai-chat-suggestion"
                className="h-auto w-full justify-start gap-2 whitespace-normal px-3.5 py-2.5 text-left text-sm font-normal"
                onClick={() => onSuggestion(suggestion.label)}
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                {suggestion.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
