'use client'

import { useEffect, useRef, useState } from 'react'

import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiRadioButton } from '@/components/ui/masai-radio-button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getInLecturePollSubmission,
  submitInLecturePollResponse,
  type InLecturePollResults,
} from '@/lib/api/learn/inLecturePollApi'
import { cn } from '@/lib/utils'
import { FloatingPopupPanel } from '../shared/FloatingPopupPanel'
import type { NormalizedInLecturePoll } from './normalizeInLecturePolls'

type InLecturePollModalProps = {
  lectureId: number
  poll: NormalizedInLecturePoll
  /** Whether the video player is currently in fullscreen. */
  isFullscreen: boolean
  /** Forwarded to {@link FloatingPopupPanel} — keeps the popup visible while fullscreen. */
  portalContainer?: HTMLElement | null
  /** Skip past the window to the next concept (seek to `endSec` + close). */
  onSkipToLecture: () => void
}

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready'
      submitted: boolean
      selectedOptionIndex: number | null
      results: InLecturePollResults | null
    }
  | { status: 'error' }

function percentOf(count: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

/** Single-line, ellipsis-truncated option text; the full text shows in a tooltip on hover. */
function TruncatedOptionText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('min-w-0 truncate', className)}>{text}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Non-blocking, in-player poll panel (see {@link FloatingPopupPanel} for the
 * draggable/resizable chrome). Unlike the quiz, the poll is answered directly
 * in this UI: on mount it checks `zef_lms_polls_submissions` for an existing
 * response for this user. A submission row is what gates which view renders —
 * with no row, the question is shown as a live, selectable form; once a row
 * exists (either from an earlier visit or a submit just now), the form is
 * replaced by a read-only results view (per-option response percentage, the
 * user's own answer labelled) and the Submit button is replaced in place by
 * "Continue" — no overlay. Opening/closing by playback window is
 * owned by `useInLecturePoll`.
 */
export function InLecturePollModal({
  lectureId,
  poll,
  isFullscreen,
  portalContainer,
  onSkipToLecture,
}: InLecturePollModalProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  // Look up any existing submission for this poll (re-check on poll change).
  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    setSelected(null)
    setSubmitError(false)
    getInLecturePollSubmission({ lectureId, pollId: poll.id })
      .then((result) => {
        if (cancelled) return
        setState({ status: 'ready', ...result })
        if (result.submitted) setSelected(result.selectedOptionIndex)
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [lectureId, poll.id])

  const submitted = state.status === 'ready' && state.submitted
  const results = state.status === 'ready' ? state.results : null

  // Move keyboard focus to the skip button once results are shown.
  useEffect(() => {
    if (submitted) actionsRef.current?.querySelector('button')?.focus()
  }, [submitted])

  const handleSubmit = () => {
    if (selected === null || submitting || submitted) return
    setSubmitting(true)
    setSubmitError(false)
    submitInLecturePollResponse({
      lectureId,
      pollId: poll.id,
      selectedOptionIndex: selected,
    })
      .then((result) => {
        setState({
          status: 'ready',
          submitted: true,
          selectedOptionIndex: result.selectedOptionIndex,
          results: result.results,
        })
      })
      .catch(() => {
        setSubmitError(true)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <FloatingPopupPanel
      title={submitted ? 'Your Submission' : 'Quick poll'}
      ariaLabel="In-lecture poll"
      testId="in-lecture-poll-modal"
      isFullscreen={isFullscreen}
      portalContainer={portalContainer}
    >
      {() => (
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
          {state.status === 'loading' ? (
            <p className="type-b2-regular text-foreground-muted">
              Loading poll…
            </p>
          ) : state.status === 'error' ? (
            <p className="type-b2-regular text-foreground-muted">
              Couldn&apos;t load the poll.
            </p>
          ) : (
            <>
              <p className="type-b1-md text-foreground">{poll.question}</p>

              <div
                className="flex flex-col gap-2"
                role={submitted ? undefined : 'radiogroup'}
                aria-label={submitted ? undefined : poll.question}
              >
                {poll.options.map((option, index) => {
                  const isSelected = selected === index

                  if (submitted) {
                    const optionCount = results?.optionCounts[index] ?? 0
                    const percent = percentOf(
                      optionCount,
                      results?.totalResponses ?? 0,
                    )
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
                            <TruncatedOptionText
                              text={option}
                              className="flex-1 type-b2-regular text-foreground"
                            />
                            {isSelected ? (
                              <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 type-caption text-white">
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
                  }

                  return (
                    <label
                      key={index}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-brand/60',
                        isSelected && 'border-brand bg-brand/5',
                      )}
                    >
                      <MasaiRadioButton
                        isSelected={isSelected}
                        onSelect={() => setSelected(index)}
                      />
                      <TruncatedOptionText
                        text={option}
                        className="flex-1 type-b2-regular text-foreground"
                      />
                    </label>
                  )
                })}
              </div>

              {submitted && results ? (
                <p className="type-b3-regular text-foreground-muted">
                  {results.totalResponses}{' '}
                  {results.totalResponses === 1 ? 'response' : 'responses'}
                </p>
              ) : null}

              {submitError ? (
                <p className="type-b3-regular text-danger">
                  Couldn&apos;t submit your response. Please try again.
                </p>
              ) : null}

              <div ref={actionsRef} className="mt-auto">
                {submitted ? (
                  <MasaiButton
                    type="primary"
                    size="md"
                    htmlType="button"
                    ctaText="Continue"
                    onClick={onSkipToLecture}
                    className="w-full"
                  />
                ) : (
                  <MasaiButton
                    type="primary"
                    size="md"
                    htmlType="button"
                    ctaText={submitting ? 'Submitting…' : 'Submit'}
                    disabled={selected === null || submitting}
                    onClick={handleSubmit}
                    className="w-full"
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </FloatingPopupPanel>
  )
}
