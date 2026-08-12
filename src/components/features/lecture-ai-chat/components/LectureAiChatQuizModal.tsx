'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import BottomDrawer from '@/components/ui/bottom-drawer'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'
import type { PracticeQuestionsPayload } from '@/server/api/ai-tutor/types/practiceQuestions'

type LectureAiChatQuizModalProps = {
  data: PracticeQuestionsPayload
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitAnswers: (answers: Record<string, string>) => void
}

function scoreAnswers(
  data: PracticeQuestionsPayload,
  answers: Record<string, string>,
): number {
  return data.questions.filter(
    (question) => answers[question.id] === question.correctOptionId,
  ).length
}

function QuizResults({
  data,
  answers,
}: {
  data: PracticeQuestionsPayload
  answers: Record<string, string>
}) {
  const score = scoreAnswers(data, answers)

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium text-foreground">
        You scored {score} / {data.questions.length}
      </p>
      {data.questions.map((question, index) => {
        const selectedOptionId = answers[question.id]
        const isCorrect = selectedOptionId === question.correctOptionId
        return (
          <div key={question.id} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">
              {index + 1}. {question.question}
            </p>
            <div className="flex flex-col gap-1.5">
              {question.options.map((option) => {
                const isSelected = option.id === selectedOptionId
                const isCorrectOption = option.id === question.correctOptionId
                return (
                  <div
                    key={option.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                      isCorrectOption && 'border-success bg-success-subtle',
                      isSelected &&
                        !isCorrectOption &&
                        'border-destructive bg-destructive/5',
                    )}
                  >
                    <span className="flex-1">{option.text}</span>
                    {isCorrectOption ? (
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    ) : null}
                    {isSelected && !isCorrectOption ? (
                      <XCircle className="size-4 shrink-0 text-destructive" />
                    ) : null}
                  </div>
                )
              })}
            </div>
            {question.explanation ? (
              <p
                className={cn(
                  'text-xs text-muted-foreground',
                  isCorrect && 'text-success',
                )}
              >
                {question.explanation}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function LectureAiChatQuizModal({
  data,
  open,
  onOpenChange,
  onSubmitAnswers,
}: LectureAiChatQuizModalProps) {
  const isMobile = useIsMobileViewport()
  const hasStoredAnswers = Boolean(
    data.answers &&
    data.questions.every((question) => data.answers?.[question.id]),
  )
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<
    string,
    string
  > | null>(hasStoredAnswers ? (data.answers ?? null) : null)

  const items = useMemo(
    () =>
      data.questions.map((question) => ({
        name: question.id,
        choices: question.options.map((option) => ({ value: option.id })),
      })),
    [data.questions],
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const answers: Record<string, string> = {}
    for (const question of data.questions) {
      const value = formData.get(question.id)
      if (typeof value === 'string') answers[question.id] = value
    }
    setSubmittedAnswers(answers)
    onSubmitAnswers(answers)
  }

  const title = data.topic ? `Practice: ${data.topic}` : 'Practice questions'

  const body = submittedAnswers ? (
    <QuizResults data={data} answers={submittedAnswers} />
  ) : (
    <Questionnaire items={items} onSubmit={handleSubmit}>
      <QuestionnaireProgress
        render={(props, state) => (
          <div {...props}>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Question {state.current} of {state.total}
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(state.current / state.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      />
      {data.questions.map((question) => (
        <QuestionnaireItem key={question.id} name={question.id}>
          <QuestionnaireTitle className="mb-2">
            {question.question}
          </QuestionnaireTitle>
          <QuestionnaireChoices>
            {question.options.map((option) => (
              <QuestionnaireChoice key={option.id} value={option.id}>
                {option.text}
              </QuestionnaireChoice>
            ))}
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
      ))}
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <div className="flex-1" />
        <QuestionnaireSkip />
        <QuestionnaireNext />
        <QuestionnaireSubmit />
      </QuestionnaireActions>
    </Questionnaire>
  )

  const closeButton = submittedAnswers ? (
    <Button
      size="sm"
      variant="outline"
      className="self-end"
      onClick={() => onOpenChange(false)}
    >
      Close
    </Button>
  ) : null

  if (isMobile) {
    return (
      <BottomDrawer
        open={open}
        onClose={() => onOpenChange(false)}
        title={title}
        bodyClassName="flex flex-col gap-4"
      >
        {body}
        {closeButton}
      </BottomDrawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {body}
        {closeButton}
      </DialogContent>
    </Dialog>
  )
}
