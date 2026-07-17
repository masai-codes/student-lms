'use client'

import { Sparkles } from 'lucide-react'

import { LECTURE_AI_CHAT_SUGGESTIONS } from '../constants'
import { Button } from '@/components/ui/button'

type LectureAiChatEmptyStateProps = {
  onSuggestion: (text: string) => void
}

export function LectureAiChatEmptyState({
  onSuggestion,
}: LectureAiChatEmptyStateProps) {
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

        <div className="flex w-full flex-col gap-2">
          {LECTURE_AI_CHAT_SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              className="h-auto w-full justify-start whitespace-normal px-3.5 py-2.5 text-left text-sm font-normal"
              onClick={() => onSuggestion(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
