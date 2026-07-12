'use client'

import { Star } from '@phosphor-icons/react'
import { useState } from 'react'

import { MasaiButton } from '@/components/ui/masai-button'
import { Textarea } from '@/components/ui/textarea'

type LectureDiscussionFeedbackFormProps = {
  disabled?: boolean
  onSubmit: (rating: number, comment: string) => void
  /** Prefilled rating when editing existing feedback (0 = none). */
  initialRating?: number
  initialComment?: string
  submitLabel?: string
}

const RATINGS = [1, 2, 3, 4, 5]

export function LectureDiscussionFeedbackForm({
  disabled = false,
  onSubmit,
  initialRating = 0,
  initialComment = '',
  submitLabel = 'Submit feedback',
}: LectureDiscussionFeedbackFormProps) {
  const [rating, setRating] = useState(initialRating)
  const [comment, setComment] = useState(initialComment)

  const canSubmit = rating >= 1 && rating <= 5 && !disabled

  return (
    <div data-testid="discussion-feedback-form" className="space-y-2">
      <p className="type-caption-md text-gray-700">
        How helpful was this discussion?
      </p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {RATINGS.map((value) => (
          <button
            key={value}
            type="button"
            data-testid={`discussion-feedback-star-${value}`}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            aria-checked={rating === value}
            role="radio"
            disabled={disabled}
            onClick={() => setRating(value)}
            className="rounded p-0.5 text-amber-500 disabled:cursor-not-allowed"
          >
            <Star
              className="size-5"
              weight={value <= rating ? 'fill' : 'regular'}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <Textarea
        data-testid="discussion-feedback-comment"
        value={comment}
        disabled={disabled}
        maxLength={1000}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Add an optional comment"
        className="min-h-14 text-sm"
      />
      <MasaiButton
        type="primary"
        size="sm"
        htmlType="button"
        ctaText={submitLabel}
        data-testid="discussion-feedback-submit"
        disabled={!canSubmit}
        onClick={() => onSubmit(rating, comment.trim())}
      />
    </div>
  )
}
