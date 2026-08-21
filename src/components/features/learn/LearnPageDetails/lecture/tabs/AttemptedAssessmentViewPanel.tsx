'use client'

import { useEffect, useState } from 'react'

import { generateInLectureQuizUrl } from '@/lib/api/learn/inLectureQuizApi'
import {
  getInLecturePollSubmission,
  type InLecturePollResults,
} from '@/lib/api/learn/inLecturePollApi'
import { cn } from '@/lib/utils'
import { FloatingPopupPanel } from '../video/shared/FloatingPopupPanel'

import type {
  InLecturePopupPollElement,
  InLecturePopupQuizElement,
} from '@/server/learn/lectureDetailTypes'

export type AttemptedAssessmentViewItem =
  | { kind: 'quiz'; quiz: InLecturePopupQuizElement }
  | { kind: 'poll'; poll: InLecturePopupPollElement }

type AttemptedAssessmentViewPanelProps = {
  lectureId: number
  item: AttemptedAssessmentViewItem
  onClose: () => void
}

/** `options` is stored as JSON; only string entries are shown. */
function parsePollOptions(options: unknown): Array<string> {
  if (!Array.isArray(options)) return []
  return options.filter(
    (option): option is string => typeof option === 'string',
  )
}

function percentOf(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

/** Adds the embed params the Assess Platform needs to render chromeless in an iframe. */
function toEmbeddableQuizUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('remove_header', '1')
    parsed.searchParams.set('hide_overview', '1')
    return parsed.toString()
  } catch {
    return url
  }
}

/** Hides per-question subjective scores on the Assess Platform's submission-review page. */
function toSubmissionViewUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('hideSubjectiveScores', '1')
    return parsed.toString()
  } catch {
    return url
  }
}

type QuizLoadState =
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error' }

function QuizSubmissionBody({
  lectureId,
  quiz,
  interacting,
}: {
  lectureId: number
  quiz: InLecturePopupQuizElement
  interacting: boolean
}) {
  const [state, setState] = useState<QuizLoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    generateInLectureQuizUrl({
      lectureId,
      assessmentTemplateId: quiz.assessmentId,
    })
      .then((result) => {
        if (cancelled) return
        const url = result.alreadySubmitted
          ? toSubmissionViewUrl(result.url)
          : toEmbeddableQuizUrl(result.url)
        setState({ status: 'ready', url })
      })
      .catch((err) => {
        if (cancelled) return
        console.error(
          '[attempted-assessments] view quiz submission FAILED',
          err,
        )
        setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [lectureId, quiz.assessmentId])

  if (state.status === 'ready') {
    return (
      <iframe
        title="Quiz submission"
        src={state.url}
        className={cn(
          'h-full w-full border-0',
          interacting && 'pointer-events-none',
        )}
        allow="clipboard-write"
      />
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="type-b2-regular text-foreground-muted">
        {state.status === 'loading'
          ? 'Loading your submission…'
          : "Couldn't load your submission."}
      </p>
    </div>
  )
}

type PollLoadState =
  | { status: 'loading' }
  | {
      status: 'ready'
      selectedOptionIndex: number | null
      results: InLecturePollResults | null
    }
  | { status: 'error' }

function PollSubmissionBody({
  lectureId,
  poll,
}: {
  lectureId: number
  poll: InLecturePopupPollElement
}) {
  const [state, setState] = useState<PollLoadState>({ status: 'loading' })
  const options = parsePollOptions(poll.options)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    getInLecturePollSubmission({ lectureId, pollId: String(poll.id) })
      .then((result) => {
        if (cancelled) return
        setState({
          status: 'ready',
          selectedOptionIndex: result.selectedOptionIndex,
          results: result.results,
        })
      })
      .catch((err) => {
        if (cancelled) return
        console.error(
          '[attempted-assessments] view poll submission FAILED',
          err,
        )
        setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [lectureId, poll.id])

  if (state.status === 'loading' || state.status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="type-b2-regular text-foreground-muted">
          {state.status === 'loading'
            ? 'Loading your submission…'
            : "Couldn't load your submission."}
        </p>
      </div>
    )
  }

  const { selectedOptionIndex, results } = state

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <p className="type-b1-md text-foreground">{poll.question}</p>
      <div className="flex flex-col gap-2">
        {options.map((option, index) => {
          const isSelected = selectedOptionIndex === index
          const optionCount = results?.optionCounts[index] ?? 0
          const percent = percentOf(optionCount, results?.totalResponses ?? 0)
          return (
            <div
              key={index}
              className={cn(
                'relative overflow-hidden rounded-lg border bg-surface px-4 py-3',
                isSelected ? 'border-brand' : 'border-border',
              )}
            >
              <div
                className={cn(
                  'absolute inset-y-0 left-0',
                  isSelected ? 'bg-brand/15' : 'bg-foreground/5',
                )}
                style={{ width: `${percent}%` }}
                aria-hidden
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate type-b2-regular text-foreground">
                    {option}
                  </span>
                  {isSelected ? (
                    <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 type-caption text-brand-foreground">
                      Your answer
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 type-b2-md text-foreground-muted">
                  {percent}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
      {results ? (
        <p className="type-b3-regular text-foreground-muted">
          {results.totalResponses}{' '}
          {results.totalResponses === 1 ? 'response' : 'responses'}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Read-only "Your Submission" popup for an already-attempted in-lecture quiz
 * or poll, opened on demand from the Attempted Assessments tab — reuses
 * {@link FloatingPopupPanel} (the same draggable/resizable chrome the
 * in-player quiz/poll popups use) but with no footer action: there's no
 * playback window to skip past here, just a dismiss (X) button.
 */
export function AttemptedAssessmentViewPanel({
  lectureId,
  item,
  onClose,
}: AttemptedAssessmentViewPanelProps) {
  return (
    <FloatingPopupPanel
      title="Your Submission"
      ariaLabel={item.kind === 'quiz' ? 'Quiz submission' : 'Poll submission'}
      testId="attempted-assessment-submission-panel"
      isFullscreen={false}
      onClose={onClose}
    >
      {({ interacting }) =>
        item.kind === 'quiz' ? (
          <QuizSubmissionBody
            lectureId={lectureId}
            quiz={item.quiz}
            interacting={interacting}
          />
        ) : (
          <PollSubmissionBody lectureId={lectureId} poll={item.poll} />
        )
      }
    </FloatingPopupPanel>
  )
}
