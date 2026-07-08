'use client'

import { Star } from '@phosphor-icons/react'
import { useState } from 'react'

import type { LectureFeedbackState } from '@/server/learn/lectureDetailTypes'
import { submitLectureFeedbackViaApi } from '@/lib/api/learn/lectureFeedbackApi'
import { MasaiButton } from '@/components/ui/masai-button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

const STARS = [1, 2, 3, 4, 5]
const MAX_FEEDBACK_LENGTH = 191

type LectureFeedbackFormProps = {
  lectureId: number
  feedback: LectureFeedbackState
}

function ReadOnlyFeedback({
  rating,
  text,
}: {
  rating: number
  text: string | null
}) {
  return (
    <section className="rounded-xl border border-border bg-white px-4 py-3">
      <h2 className="type-b1-md text-gray-900">Your feedback</h2>
      <div
        className="mt-2 flex gap-1"
        role="img"
        aria-label={`Rated ${rating} out of 5`}
      >
        {STARS.map((star) => (
          <Star
            key={star}
            size={24}
            weight="fill"
            className={cn(star <= rating ? 'text-amber-400' : 'text-gray-200')}
          />
        ))}
      </div>
      {text ? (
        <p className="type-b2-regular mt-2 whitespace-pre-wrap text-gray-700">
          {text}
        </p>
      ) : null}
    </section>
  )
}

export function LectureFeedbackForm({
  lectureId,
  feedback,
}: LectureFeedbackFormProps) {
  const [rating, setRating] = useState(feedback.rating ?? 0)
  const [text, setText] = useState(feedback.text ?? '')
  const [hovered, setHovered] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [savedRating, setSavedRating] = useState(feedback.rating)

  if (!feedback.canSubmit) {
    if (savedRating == null) return null
    return <ReadOnlyFeedback rating={savedRating} text={feedback.text} />
  }

  const handleSubmit = async () => {
    if (rating < 1 || submitting) return
    pushLearnEvent(learnEntityEvent('lecture', 'feedback_submit', lectureId), {
      lecture_id: lectureId,
      rating,
    })
    setSubmitting(true)
    try {
      const trimmed = text.trim()
      const result = await submitLectureFeedbackViaApi({
        lectureId,
        rating,
        feedback: trimmed.length > 0 ? trimmed : undefined,
      })
      setSavedRating(result.rating)
      toast.success('Thanks for your feedback!')
    } catch {
      toast.error('Could not submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const active = hovered || rating

  return (
    <section className="rounded-xl border border-border bg-white px-4 py-3">
      <h2 className="type-b1-md text-gray-900">How would you rate this lecture?</h2>
      <div
        className="mt-2 flex gap-1.5"
        role="radiogroup"
        aria-label="Lecture rating"
      >
        {STARS.map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
            disabled={submitting}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed"
          >
            <Star
              size={28}
              weight={star <= active ? 'fill' : 'regular'}
              className={cn(
                'transition-colors',
                star <= active ? 'text-amber-400' : 'text-gray-300',
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX_FEEDBACK_LENGTH}
        disabled={submitting}
        placeholder="Share what worked or what could be better (optional)"
        className="mt-3"
      />
      <div className="mt-3 flex justify-end">
        <MasaiButton
          type="primary"
          size="md"
          htmlType="button"
          ctaText={savedRating != null ? 'Update feedback' : 'Submit feedback'}
          disabled={rating < 1 || submitting}
          onClick={handleSubmit}
        />
      </div>
    </section>
  )
}
