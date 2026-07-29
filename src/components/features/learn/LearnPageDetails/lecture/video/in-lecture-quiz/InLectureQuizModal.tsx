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
/** Beat between detecting the submission and revealing the skip overlay. */
const SKIP_REVEAL_DELAY_MS = 1000

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
 * submit button; once this session's submission is saved, after a short beat
 * a centered "Continue" button appears. Opening/closing by
 * playback window is owned by `useInLectureQuiz`.
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
  const [showSkip, setShowSkip] = useState(false)
  const skipRef = useRef<HTMLDivElement>(null)

  // Fetch the embeddable quiz URL (re-fetch on quiz change / manual retry).
  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    console.log('[in-lecture-quiz] fetching assessment url', {
      lectureId,
      assessmentId: quiz.assessmentId,
    })
    generateInLectureQuizUrl({
      lectureId,
      assessmentTemplateId: quiz.assessmentId,
    })
      .then((result) => {
        if (cancelled) return
        const url = result.alreadySubmitted
          ? result.url
          : toEmbeddableQuizUrl(result.url)
        console.log('[in-lecture-quiz] assessment url ready', {
          url,
          alreadySubmitted: result.alreadySubmitted,
        })
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

  // Poll for the saved submission on a fresh test. Once the row exists (the
  // Assess `gradeAssessment` callback persisted it this session), wait a beat
  // then reveal the skip overlay.
  useEffect(() => {
    if (state.status !== 'ready' || alreadySubmitted || showSkip) return
    let cancelled = false
    let revealTimer: number | undefined
    const check = () => {
      checkInLectureQuizGraded({
        lectureId,
        assessmentTemplateId: quiz.assessmentId,
      })
        .then((result) => {
          if (cancelled || !result.graded) return
          console.log('[in-lecture-quiz] graded — revealing skip in 1s')
          window.clearInterval(intervalId)
          revealTimer = window.setTimeout(() => {
            if (!cancelled) setShowSkip(true)
          }, SKIP_REVEAL_DELAY_MS)
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
      if (revealTimer) window.clearTimeout(revealTimer)
    }
  }, [state.status, alreadySubmitted, showSkip, lectureId, quiz.assessmentId])

  // Move keyboard focus to the skip button once the overlay appears.
  useEffect(() => {
    if (showSkip) skipRef.current?.querySelector('button')?.focus()
  }, [showSkip])

  return (
    <FloatingPopupPanel
      title={alreadySubmitted ? 'Your Submission' : 'Test your knowledge'}
      ariaLabel="In-lecture quiz"
      testId="in-lecture-quiz-modal"
      isFullscreen={isFullscreen}
      portalContainer={portalContainer}
      overlay={
        showSkip ? (
          <div
            ref={skipRef}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <MasaiButton
              type="primary"
              size="md"
              htmlType="button"
              ctaText="Continue"
              onClick={onSkipToLecture}
            />
          </div>
        ) : null
      }
    >
      {({ interacting }) =>
        state.status === 'ready' ? (
          <iframe
            title="In-lecture quiz"
            src={state.url}
            className={cn(
              'h-full w-full border-0',
              // Inactive while dragging/resizing (so the parent keeps the
              // pointer) and under the skip overlay.
              (interacting || showSkip) && 'pointer-events-none',
            )}
            allow="camera; microphone; fullscreen; clipboard-write"
            onLoad={() =>
              console.log('[in-lecture-quiz] iframe loaded', { url: state.url })
            }
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
