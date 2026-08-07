import { useEffect, useRef, useState } from 'react'
import type { InterviewTurn } from '@/server/api/interviews/types/interviewSession'

/** Below this distance (px) from the bottom, treat the user as "following along". */
const NEAR_BOTTOM_THRESHOLD_PX = 96

function QuestionBubble({
  children,
  label,
}: {
  children: string
  label: string
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="px-1 text-xs font-medium text-foreground-muted font-sans">
        {label}
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-background p-4 text-sm leading-relaxed text-foreground sm:text-base">
        {children}
      </div>
    </div>
  )
}

function AnswerBubble({ turn }: { turn: InterviewTurn }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-border bg-background p-4 text-sm leading-relaxed text-foreground sm:text-base">
        {turn.answerAudioBase64 ? (
          <audio
            controls
            src={`data:audio/wav;base64,${turn.answerAudioBase64}`}
            className="h-10 max-w-full"
          />
        ) : (
          turn.transcript
        )}
      </div>
    </div>
  )
}

/**
 * Lyrics-style scrolling history: past Q&A pairs stack upward and dim, the
 * current question stays bright at the bottom. Hovering a past pair brings
 * both the question and its answer back to full opacity together. Auto-
 * scrolls to the current question on every new turn UNLESS the user has
 * manually scrolled away from the bottom to read back.
 */
export function InterviewTimeline({
  topicLabel,
  questionNumber,
  totalQuestions,
  question,
  answeredTurns,
}: {
  topicLabel: string
  questionNumber: number
  totalQuestions: number
  question: string
  answeredTurns: Array<InterviewTurn>
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setAutoScroll(distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX)
  }

  // Deliberately keyed on content, not `autoScroll` — re-enabling auto-scroll
  // by scrolling back down shouldn't itself trigger a jump.
  useEffect(() => {
    if (!autoScroll) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [question, answeredTurns.length])

  return (
    <div ref={containerRef} onScroll={handleScroll} className="overflow-y-auto">
      <h1 className="text-2xl md:text-4xl mb-2">{topicLabel}</h1>
      <p className="mb-4 text-base font-medium uppercase tracking-wide text-foreground-muted">
        Question {questionNumber} of {totalQuestions}
      </p>

      <div className="flex flex-col gap-4 pb-2 font-serif">
        {answeredTurns.map((turn) => (
          <div
            key={turn.index}
            className="flex flex-col gap-2 opacity-45 transition-opacity duration-200 hover:opacity-100"
          >
            <QuestionBubble label={`Question ${turn.index + 1}`}>
              {turn.question}
            </QuestionBubble>
            <AnswerBubble turn={turn} />
          </div>
        ))}

        <div data-testid="interview-question">
          <QuestionBubble label={`Question ${questionNumber}`}>
            {question}
          </QuestionBubble>
        </div>
      </div>
      <div ref={bottomRef} className="h-4" />
    </div>
  )
}
