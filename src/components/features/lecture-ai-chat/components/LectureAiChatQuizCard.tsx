'use client'

import { useState } from 'react'
import { ClipboardList, Maximize2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LectureAiChatQuizModal } from './LectureAiChatQuizModal'
import type { PracticeQuestionsPayload } from '@/server/api/ai-tutor/types/practiceQuestions'

type LectureAiChatQuizCardProps = {
  data: PracticeQuestionsPayload
  /** Open the quiz modal immediately — true only right after a fresh generation. */
  autoOpen: boolean
  onSubmitAnswers: (quizId: string, answers: Record<string, string>) => void
}

export function LectureAiChatQuizCard({
  data,
  autoOpen,
  onSubmitAnswers,
}: LectureAiChatQuizCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(autoOpen)

  const isAnswered = data.questions.every(
    (question) => data.answers?.[question.id],
  )
  const score = isAnswered
    ? data.questions.filter(
        (question) => data.answers?.[question.id] === question.correctOptionId,
      ).length
    : 0

  return (
    <>
      <Card className="w-full max-w-[360px] gap-0 py-3">
        <CardContent className="flex items-center gap-3 px-4">
          <ClipboardList className="size-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {data.topic ? `Practice: ${data.topic}` : 'Practice questions'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAnswered
                ? `Scored ${score} / ${data.questions.length}`
                : `${data.questions.length} question${data.questions.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
          >
            <Maximize2 className="size-3.5" />
            {isAnswered ? 'Review' : 'Take quiz'}
          </Button>
        </CardContent>
      </Card>

      <LectureAiChatQuizModal
        data={data}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmitAnswers={(answers) =>
          onSubmitAnswers(data.quizId ?? '', answers)
        }
      />
    </>
  )
}
