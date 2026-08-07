'use client'

import { useEffect, useRef, useState } from 'react'

import { MasaiButton } from '@/components/ui/masai-button'
import {
  checkInLectureQuizGraded,
  generateInLectureQuizUrl,
} from '@/lib/api/learn/inLectureQuizApi'
import { cn } from '@/lib/utils'
import { FloatingPopupPanel } from '../shared/FloatingPopupPanel'
import type { NormalizedInLectureQuiz } from './normalizeInLectureQuizzes'

/** How often to poll whether the Assess Platform has graded this attempt. */
const GRADED_POLL_INTERVAL_MS = 3000

type InLectureQuizModalProps = {
  lectureId: number
  quiz: NormalizedInLectureQuiz
  /** Whether the video player is currently in fullscreen. */
  isFullscreen: boolean
  /** Forwarded to {@link FloatingPopupPanel} — keeps the popup visible while fullscreen. */
  portalContainer?: HTMLElement | null
  /** Skip past the window to the next concept (seek to `endSec` + close). */
  onSkipToLecture: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; url: string; alreadySubmitted: boolean }
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

/**
 * Non-blocking, in-player quiz panel (see {@link FloatingPopupPanel} for the
 * draggable/resizable chrome). Submission is handled by the iframe's own
 * submit button; as soon as the Assess `gradeAssessment` callback has persisted
 * this session's attempt, the panel skips past the quiz window on its own —
 * there is no manual Continue action (see the commented-out ribbon below). An
 * already-submitted quiz is review-only: it never polls and never auto-skips.
 * Opening/closing by playback window is owned by `useInLectureQuiz`.
 */
export function InLectureQuizModal({
  lectureId,
  quiz,
  isFullscreen,
  portalContainer,
  onSkipToLecture,
}: InLectureQuizModalProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  // Held in a ref so a new callback identity from the parent can't restart the
  // grading poll (and re-arm a second auto-skip) mid-attempt.
  const skipRef = useRef(onSkipToLecture)
  skipRef.current = onSkipToLecture

  // Fetch the embeddable quiz URL (re-fetch on quiz change / manual retry).
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
          ? result.url
          : toEmbeddableQuizUrl(result.url)
        setState({
          status: 'ready',
          url,
          alreadySubmitted: result.alreadySubmitted,
        })
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[in-lecture-quiz] assessment url FAILED', err)
          setState({ status: 'error' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [lectureId, quiz.assessmentId, attempt])

  const alreadySubmitted = state.status === 'ready' && state.alreadySubmitted

  // Poll for the saved submission on a fresh test. The moment the row exists
  // (the Assess `gradeAssessment` callback persisted it this session), skip
  // past the quiz window — the same thing the Continue button did.
  useEffect(() => {
    if (state.status !== 'ready' || alreadySubmitted) return
    let cancelled = false
    // Several polls can be in flight when grading lands; only the first one
    // gets to skip.
    let skipped = false
    const check = () => {
      checkInLectureQuizGraded({
        lectureId,
        assessmentTemplateId: quiz.assessmentId,
      })
        .then((result) => {
          if (cancelled || !result.graded || skipped) return
          skipped = true
          window.clearInterval(intervalId)
          skipRef.current()
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
  }, [state.status, alreadySubmitted, lectureId, quiz.assessmentId])

  return (
    <FloatingPopupPanel
      title={alreadySubmitted ? 'Your Submission' : 'Test your knowledge'}
      ariaLabel="In-lecture quiz"
      testId="in-lecture-quiz-modal"
      isFullscreen={isFullscreen}
      portalContainer={portalContainer}
      // Manual Continue ribbon, parked while the panel auto-skips on grading.
      // Restore by uncommenting and reinstating the `submitted` state that
      // enables it (`canContinue = alreadySubmitted || submitted`).
      // footer={
      //   <div ref={continueRef} className="flex justify-center">
      //     <MasaiButton
      //       type="primary"
      //       size="md"
      //       htmlType="button"
      //       ctaText="Continue"
      //       disabled={!canContinue}
      //       onClick={onSkipToLecture}
      //       // Stretches across the ribbon, capped so it stays a button rather
      //       // than a banner on a wide (resized) panel.
      //       className="w-full max-w-md"
      //       data-testid="in-lecture-quiz-continue"
      //     />
      //   </div>
      // }
    >
      {({ interacting }) =>
        state.status === 'ready' ? (
          <iframe
            title="In-lecture quiz"
            src={state.url}
            className={cn(
              'h-full w-full border-0',
              // Inactive while dragging/resizing, so the parent keeps the
              // pointer. Stays interactive after submitting — the iframe shows
              // the result, and Continue now lives outside it.
              interacting && 'pointer-events-none',
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
        )
      }
    </FloatingPopupPanel>
  )
}
