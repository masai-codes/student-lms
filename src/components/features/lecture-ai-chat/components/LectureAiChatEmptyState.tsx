'use client'

import {
  BookOpen,
  ClipboardList,
  Lightbulb,
  NotebookText,
  Sparkles,
} from 'lucide-react'

import { useLectureAiChatSuggestions } from '../hooks/LectureAiChatSuggestionsContext'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'
import { Button } from '@/components/ui/button'
import type {
  LectureAiChatSuggestion,
  LectureAiChatSuggestionKind,
} from '@/server/learn/utils/buildLectureAiChatSuggestions'

type LectureAiChatEmptyStateProps = {
  lectureId: number
  onSuggestion: (text: string) => void
}

const SUGGESTION_ICONS: Record<LectureAiChatSuggestionKind, typeof Sparkles> = {
  faq: Lightbulb,
  summary: NotebookText,
  explain: BookOpen,
  quiz: ClipboardList,
}

function SuggestionIcon({ kind }: { kind: LectureAiChatSuggestionKind }) {
  const Icon = SUGGESTION_ICONS[kind]
  return <Icon className="size-4 shrink-0 text-muted-foreground" />
}

function suggestionTestId(kind: LectureAiChatSuggestionKind): string {
  return kind === 'faq'
    ? 'lecture-ai-chat-faq-suggestion'
    : 'lecture-ai-chat-suggestion'
}

export function LectureAiChatEmptyState({
  lectureId,
  onSuggestion,
}: LectureAiChatEmptyStateProps) {
  const suggestions = useLectureAiChatSuggestions()

  const handleClick = (suggestion: LectureAiChatSuggestion) => {
    if (suggestion.kind === 'faq') {
      pushLearnEvent(
        learnEntityEvent('lecture', 'ai_chat_faq_click', lectureId),
        { question: suggestion.question },
      )
    }
    onSuggestion(suggestion.question)
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

        {suggestions.length > 0 ? (
          <div
            className="flex w-full flex-col gap-2"
            data-testid="lecture-ai-chat-suggestions"
          >
            {suggestions.map((suggestion) => (
              <Button
                key={`${suggestion.kind}:${suggestion.question}`}
                type="button"
                variant="outline"
                data-testid={suggestionTestId(suggestion.kind)}
                className="h-auto w-full justify-start gap-2 whitespace-normal px-3.5 py-2.5 text-left text-sm font-normal"
                onClick={() => handleClick(suggestion)}
              >
                <SuggestionIcon kind={suggestion.kind} />
                {suggestion.question}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
