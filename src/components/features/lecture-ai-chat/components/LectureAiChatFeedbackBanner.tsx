'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'

import type { LectureAiChatFeedbackRating } from '../hooks/useLectureAiChatFeedback'
import { cn } from '@/lib/utils'

const RATINGS: Array<{
  value: LectureAiChatFeedbackRating
  emoji: string
  label: string
}> = [
  { value: 1, emoji: '😞', label: 'Not helpful' },
  { value: 2, emoji: '😕', label: 'Slightly helpful' },
  { value: 3, emoji: '😐', label: 'Somewhat helpful' },
  { value: 4, emoji: '🙂', label: 'Very helpful' },
  { value: 5, emoji: '🤩', label: 'Extremely helpful' },
]

const FEEDBACK_MAX_LENGTH = 500

type LectureAiChatFeedbackBannerProps = {
  isSubmitting: boolean
  submitError: string | null
  onSubmit: (rating: LectureAiChatFeedbackRating, feedback?: string) => void
  onDismiss: () => void
  className?: string
}

/**
 * Compact "rate this chat" card shown above the composer, once the AI's
 * reply to the first message of a new thread completes (spec:
 * docs/AI_CHAT_FEEDBACK.md). Picking a rating reveals an optional comment
 * box; the X always skips without submitting.
 */
export function LectureAiChatFeedbackBanner({
  isSubmitting,
  submitError,
  onSubmit,
  onDismiss,
  className,
}: LectureAiChatFeedbackBannerProps) {
  const [rating, setRating] = useState<LectureAiChatFeedbackRating | null>(null)
  const [feedback, setFeedback] = useState('')

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-3xl rounded-2xl border p-3',
        className,
      )}
      style={{ background: '#F0EFFA', borderColor: '#D4D2F0' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            How helpful was this AI chat?
          </p>
          <p className="text-xs text-muted-foreground">
            Your feedback improves the experience for everyone
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss feedback"
          onClick={onDismiss}
          disabled={isSubmitting}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="Rate this AI chat"
        className="mt-3 flex justify-center gap-3"
      >
        {RATINGS.map((option) => {
          const selected = rating === option.value
          const dimmed = rating != null && !selected
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              onClick={() => setRating(option.value)}
              className="flex flex-col items-center gap-1 rounded-xl p-1 transition-all focus-visible:outline-none"
              style={{
                opacity: dimmed ? 0.4 : 1,
                transform: selected ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <span className="text-2xl leading-none">{option.emoji}</span>
            </button>
          )
        })}
      </div>

      {rating != null ? (
        <div className="mt-3">
          <textarea
            value={feedback}
            onChange={(event) =>
              setFeedback(event.target.value.slice(0, FEEDBACK_MAX_LENGTH))
            }
            rows={2}
            placeholder="Share your valuable feedback… (optional)"
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div
            className={cn(
              'mt-1 text-right text-xs text-muted-foreground',
              feedback.length > 450 && 'text-red-500',
            )}
          >
            {feedback.length}/{FEEDBACK_MAX_LENGTH}
          </div>
        </div>
      ) : null}

      {submitError ? (
        <p className="mt-2 text-xs text-red-500">{submitError}</p>
      ) : null}

      {rating != null ? (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            aria-label="Submit feedback"
            onClick={() => onSubmit(rating, feedback)}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-[14px] px-4 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            style={{ background: '#6962AC' }}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit
          </button>
        </div>
      ) : null}
    </div>
  )
}
