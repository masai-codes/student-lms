'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'

import { MasaiButton } from '@/components/ui/masai-button'
import {
  checkInLectureQuizGraded,
  generateInLectureQuizUrl,
} from '@/lib/api/learn/inLectureQuizApi'
import { cn } from '@/lib/utils'
import type { QuizResolution } from './useInLectureQuiz'
import type { NormalizedInLectureQuiz } from './normalizeInLectureQuizzes'

/** Seconds before the window end that the client-side auto-submit countdown appears. */
const AUTO_SUBMIT_SECONDS = 7
/** How often to poll for a real (Assess Platform confirmed) submission. */
const GRADED_POLL_INTERVAL_MS = 3000

type InLectureQuizModalProps = {
  lectureId: number
  quiz: NormalizedInLectureQuiz
  /** Live playback position, used to arm the auto-submit countdown. */
  progressSeconds: number
  /** Whether the video player is currently in fullscreen. */
  isFullscreen: boolean
  /** Persist the resolved outcome (does not close the modal). */
  onResolve: (outcome: QuizResolution) => void
  /** Skip past the window to the next concept (seek + close). */
  onSkipToLecture: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error' }

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

/** `quiz` → `countdown` → (`auto_submitted` | `stopped`), or `quiz`/`countdown` → `submitted`. */
type Phase = 'quiz' | 'countdown' | 'auto_submitted' | 'stopped' | 'submitted'

/**
 * Non-blocking, in-player quiz panel. The video keeps playing behind it. On
 * open it embeds an Assess Platform test for this lecture's `assessmentTemplate`.
 *
 * Two independent ways this resolves:
 * - Client-side countdown: in the last {@link AUTO_SUBMIT_SECONDS} seconds of the
 *   window the iframe blurs and a centered progress button counts down; letting
 *   it complete auto-submits, clicking it stops the auto-submit.
 * - Server-confirmed submission: while open, this polls whether the Assess
 *   Platform has actually graded the attempt (the student hit submit inside the
 *   iframe, via its `gradeAssessment` webhook). That's a stronger signal and
 *   preempts the countdown — the modal blurs with a "Skip to lecture" /
 *   "Continue watching" choice.
 */
export function InLectureQuizModal({
  lectureId,
  quiz,
  progressSeconds,
  isFullscreen,
  onResolve,
  onSkipToLecture,
}: InLectureQuizModalProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [phase, setPhase] = useState<Phase>('quiz')
  const [fillPct, setFillPct] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_SUBMIT_SECONDS)

  // Fetch the embeddable quiz URL (re-fetch on quiz change / manual retry).
  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    generateInLectureQuizUrl({
      lectureId,
      assessmentTemplateId: quiz.assessmentTemplate,
    })
      .then((result) => {
        if (!cancelled) {
          setState({ status: 'ready', url: toEmbeddableQuizUrl(result.url) })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [lectureId, quiz.assessmentTemplate, attempt])

  const onResolveRef = useRef(onResolve)
  onResolveRef.current = onResolve

  // Poll for a real submission while unresolved. A positive result preempts
  // whatever phase we're in (including mid-countdown, or after the user stopped
  // the auto-submit) — it's the authoritative signal, so it always wins over the
  // client-side timer guess.
  useEffect(() => {
    if (phase === 'auto_submitted' || phase === 'submitted') return
    let cancelled = false
    const check = () => {
      checkInLectureQuizGraded({
        lectureId,
        assessmentTemplateId: quiz.assessmentTemplate,
      })
        .then((result) => {
          if (cancelled || !result.graded) return
          setPhase('submitted')
          onResolveRef.current('submitted')
        })
        .catch(() => {
          /* transient poll failure — next tick retries */
        })
    }
    check()
    const intervalId = window.setInterval(check, GRADED_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [phase, lectureId, quiz.assessmentTemplate])

  // Arm the countdown once the video reaches the last few seconds of the window.
  useEffect(() => {
    if (phase === 'quiz' && progressSeconds >= quiz.endSec - AUTO_SUBMIT_SECONDS) {
      setPhase('countdown')
    }
  }, [phase, progressSeconds, quiz.endSec])

  // Run the countdown: fill the bar over the window and auto-submit at the end.
  useEffect(() => {
    if (phase !== 'countdown') return
    const startedAt = Date.now()
    const durationMs = AUTO_SUBMIT_SECONDS * 1000
    let frame = 0
    const tick = () => {
      const elapsed = Date.now() - startedAt
      const pct = Math.min(100, (elapsed / durationMs) * 100)
      setFillPct(pct)
      setSecondsLeft(Math.max(0, Math.ceil((durationMs - elapsed) / 1000)))
      if (elapsed >= durationMs) {
        setPhase('auto_submitted')
        onResolveRef.current('auto_submitted')
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  const stopAutoSubmit = () => {
    setPhase('stopped')
    onResolveRef.current('stopped')
  }

  // Every non-quiz phase covers the iframe with a dim/blur layer (it stays
  // visible but inactive underneath) — including `stopped`, which freezes the
  // countdown screen in place rather than dismissing it.
  const dimmed = phase !== 'quiz'

  return (
    <div className="pointer-events-none absolute inset-0 z-[60] flex items-end justify-end p-4">
      <div
        className={cn(
          'pointer-events-auto relative flex w-[min(100%,32rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl',
          // Full-height only when the video itself isn't fullscreen — in
          // fullscreen the current capped height already reads fine.
          isFullscreen ? 'h-[min(85%,42rem)]' : 'h-full',
        )}
        role="dialog"
        aria-label="In-lecture quiz"
        data-testid="in-lecture-quiz-modal"
      >
        <header className="flex items-center border-b border-border px-5 py-3">
          <p className="type-b1-md text-foreground">Pop Quiz</p>
        </header>

        <div className="relative flex-1 bg-surface-muted">
          {state.status === 'ready' ? (
            <iframe
              title="In-lecture quiz"
              src={state.url}
              className={cn(
                'h-full w-full border-0',
                // Keep it visible but inactive under the dim overlay.
                dimmed && 'pointer-events-none',
              )}
              allow="camera; microphone; fullscreen; clipboard-write"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              {state.status === 'loading' ? (
                <p className="type-b2-regular text-foreground-muted">
                  Loading your quiz…
                </p>
              ) : (
                <>
                  <p className="type-b2-regular text-foreground-muted">
                    Couldn&apos;t load the quiz.
                  </p>
                  <MasaiButton
                    type="secondary"
                    size="sm"
                    htmlType="button"
                    ctaText="Retry"
                    onClick={() => setAttempt((n) => n + 1)}
                  />
                </>
              )}
            </div>
          )}

          {/* Countdown / stopped / resolved overlay. */}
          {phase !== 'quiz' ? (
            <div
              className={cn(
                'absolute inset-0 flex flex-col items-center justify-center gap-4 p-6',
                // A dim/blur layer ABOVE the iframe (it stays visible underneath).
                dimmed && 'bg-black/40 backdrop-blur-sm',
              )}
            >
              {phase === 'countdown' || phase === 'stopped' ? (
                <button
                  type="button"
                  onClick={phase === 'countdown' ? stopAutoSubmit : undefined}
                  className={cn(
                    'relative w-72 overflow-hidden rounded-full bg-primary-500 px-6 py-3 text-center type-b1-md text-white shadow-lg',
                    phase === 'stopped' && 'cursor-default',
                  )}
                >
                  {/* Violet loading-bar fill sweeping left→right over the 7
                      seconds. The gradient's leading edge matches the track
                      colour (primary-500 === primary-600), so it feathers in
                      softly instead of a hard line. rAF drives the width for
                      smooth per-frame progress; it freezes on stop. */}
                  <span
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-800 to-primary-500"
                    style={{ width: `${fillPct}%` }}
                    aria-hidden
                  />
                  <span className="relative">
                    Auto Submitting. in {secondsLeft}
                  </span>
                </button>
              ) : null}

              {phase === 'auto_submitted' ? (
                <div className="flex w-64 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 type-b1-md text-white shadow-lg">
                  <CheckCircle weight="fill" className="size-5" aria-hidden />
                  Auto-submitted
                </div>
              ) : null}

              <MasaiButton
                type={phase === 'submitted' ? 'primary' : 'secondary'}
                size="md"
                htmlType="button"
                ctaText="Skip to next concept"
                onClick={onSkipToLecture}
                className="pointer-events-auto"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
