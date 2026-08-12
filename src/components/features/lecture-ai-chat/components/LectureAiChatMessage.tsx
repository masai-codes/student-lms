'use client'

import { memo } from 'react'
import { RotateCcw } from 'lucide-react'

import { LectureAiChatMarkdown } from './LectureAiChatMarkdown'
import { LectureAiChatQuizCard } from './LectureAiChatQuizCard'
import type { LectureAiChatMessage as LectureAiChatMessageModel } from '../types'
import { Button } from '@/components/ui/button'

function TypingDots() {
  return (
    <span
      className="lecture-ai-chat-dots text-muted-foreground"
      aria-label="Assistant is thinking"
      role="status"
    >
      <span />
      <span />
      <span />
    </span>
  )
}

type LectureAiChatMessageProps = {
  message: LectureAiChatMessageModel
  onRetry: () => void
  canRetry: boolean
  onSubmitPracticeQuestionAnswers: (
    messageId: string,
    quizId: string,
    answers: Record<string, string>,
  ) => void
}

function LectureAiChatMessageImpl({
  message,
  onRetry,
  canRetry,
  onSubmitPracticeQuestionAnswers,
}: LectureAiChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  const showDots =
    message.status === 'thinking' ||
    (message.status === 'streaming' &&
      message.content.length === 0 &&
      !message.practiceQuestions)

  return (
    <div className="flex w-full flex-col items-start gap-2">
      {showDots ? (
        <TypingDots />
      ) : message.status === 'error' ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Something went wrong. Please try again.
          </p>
          {canRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCcw className="size-3.5" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="w-full text-sm leading-relaxed text-foreground">
          {message.content ? (
            <LectureAiChatMarkdown content={message.content} />
          ) : null}
          {message.status === 'streaming' ? (
            <span className="lecture-ai-chat-cursor" aria-hidden="true" />
          ) : null}
          {message.practiceQuestions ? (
            <LectureAiChatQuizCard
              data={message.practiceQuestions}
              autoOpen={Boolean(message.practiceQuestionsJustGenerated)}
              onSubmitAnswers={(quizId, answers) =>
                onSubmitPracticeQuestionAnswers(message.id, quizId, answers)
              }
            />
          ) : null}
        </div>
      )}
    </div>
  )
}

export const LectureAiChatMessage = memo(LectureAiChatMessageImpl)
