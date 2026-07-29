'use client'

import { useState } from 'react'

import type { LectureFeedbackState } from '@/server/learn/lectureDetailTypes'
import { getLectureFeedbackTagOptions } from '@/server/learn/utils/lectureFeedbackTags'
import { submitLectureFeedbackViaApi } from '@/lib/api/learn/lectureFeedbackApi'
import { MasaiButton } from '@/components/ui/masai-button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type EmojiRating = {
  value: number
  emoji: string
  label: string
  glow: string
}

// Five emoji faces mapped onto the existing 1–5 rating the backend already
// accepts, so this UI change needs no API/schema changes.
const EMOJI_RATINGS: ReadonlyArray<EmojiRating> = [
  { value: 1, emoji: '😞', label: 'Poor', glow: 'bg-rose-400/40' },
  { value: 2, emoji: '😕', label: 'Meh', glow: 'bg-orange-400/40' },
  { value: 3, emoji: '🙂', label: 'Okay', glow: 'bg-amber-400/40' },
  { value: 4, emoji: '😄', label: 'Great', glow: 'bg-lime-400/40' },
  { value: 5, emoji: '🤩', label: 'Amazing', glow: 'bg-emerald-400/45' },
]

const MAX_FEEDBACK_LENGTH = 191

function ratingFor(value: number): EmojiRating | undefined {
  return EMOJI_RATINGS.find((item) => item.value === value)
}

type LectureFeedbackFormProps = {
  lectureId: number
  feedback: LectureFeedbackState
}

function ReadOnlyFeedback({
  rating,
  text,
  tags,
}: {
  rating: number
  text: string | null
  tags: Array<string>
}) {
  const chosen = ratingFor(rating)
  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-3">
      <h2 className="type-b1-md text-foreground">Your feedback</h2>
      <div
        className="mt-2 flex items-center gap-2"
        role="img"
        aria-label={`Rated ${rating} out of 5${chosen ? ` — ${chosen.label}` : ''}`}
      >
        <span className="text-2xl leading-none" aria-hidden="true">
          {chosen?.emoji}
        </span>
        {chosen ? (
          <span className="type-b2-md text-foreground-subtle">
            {chosen.label}
          </span>
        ) : null}
      </div>
      {tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="type-b3-regular rounded-full border border-border bg-surface-muted px-2.5 py-1 text-foreground-subtle"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {text ? (
        <p className="type-b2-regular mt-2 whitespace-pre-wrap text-foreground">
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
  const [tags, setTags] = useState<Array<string>>(feedback.tags ?? [])
  const [hovered, setHovered] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [savedRating, setSavedRating] = useState(feedback.rating)
  const [savedTags, setSavedTags] = useState(feedback.tags ?? [])

  if (!feedback.canSubmit) {
    if (savedRating == null) return null
    return (
      <ReadOnlyFeedback
        rating={savedRating}
        text={feedback.text}
        tags={savedTags}
      />
    )
  }

  // Tags only exist in the `zef` flow — the legacy flow never shows them.
  const tagOptions =
    feedback.mode === 'zef' && rating > 0
      ? getLectureFeedbackTagOptions(rating)
      : []

  const selectRating = (value: number) => {
    // Tag sets differ between low and high ratings, so a rating change
    // invalidates any tags picked under the previous set.
    if (value !== rating) setTags([])
    setRating(value)
  }

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )
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
        tags,
      })
      setSavedRating(result.rating)
      setSavedTags(result.tags)
      toast.success('Thanks for your feedback!')
    } catch {
      toast.error('Could not submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // The hovered/focused emoji previews; otherwise the committed rating shows.
  const active = hovered || rating
  const activeMeta = ratingFor(active)

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface px-4 py-3">
      <h2 className="type-b1-md text-foreground">
        How would you rate this lecture?
      </h2>

      <div
        className="mt-1 flex items-end justify-center gap-1"
        role="radiogroup"
        aria-label="Lecture rating"
      >
        {EMOJI_RATINGS.map((item) => {
          const isActive = active === item.value
          const isSelected = rating === item.value
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${item.label} (${item.value} out of 5)`}
              disabled={submitting}
              onMouseEnter={() => setHovered(item.value)}
              onMouseLeave={() => setHovered(0)}
              onFocus={() => setHovered(item.value)}
              onBlur={() => setHovered(0)}
              onClick={() => selectRating(item.value)}
              className="group relative flex items-center justify-center rounded-xl px-0.5 py-2 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#4F6BED]/40 disabled:cursor-not-allowed"
            >
              {/* Coloured halo that blooms behind the live emoji. */}
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute h-10 w-10 rounded-full blur-md transition-opacity duration-200',
                  item.glow,
                  isActive
                    ? 'animate-masaiverse-emoji-glow-in opacity-100'
                    : 'opacity-0',
                )}
              />
              {/* Scale/lift lives on this wrapper so it never clashes with the
                  pop keyframe running on the emoji glyph inside. */}
              <span
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center transition-transform duration-200 ease-out will-change-transform',
                  isActive ? '-translate-y-1 scale-125' : 'scale-100',
                )}
              >
                <span
                  // Remounting on (de)select replays the springy pop.
                  key={isSelected ? `selected-${rating}` : `idle-${item.value}`}
                  aria-hidden="true"
                  className={cn(
                    'text-3xl leading-none transition-[filter,opacity] duration-200',
                    isActive
                      ? 'opacity-100 grayscale-0'
                      : 'opacity-55 grayscale group-hover:opacity-80',
                    isSelected && 'animate-masaiverse-emoji-pop',
                  )}
                >
                  {item.emoji}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Live caption that rises in as the active rating changes. */}
      <div className="mt-1 flex h-6 items-center justify-center">
        {activeMeta ? (
          <span
            key={activeMeta.value}
            className="type-b2-md animate-masaiverse-rating-label-in text-foreground"
          >
            {activeMeta.label}
          </span>
        ) : (
          <span className="type-b3-regular text-foreground-subtle">
            Tap an emoji to rate
          </span>
        )}
      </div>

      {tagOptions.length > 0 ? (
        <div
          className="mt-1 flex flex-wrap justify-center gap-1.5"
          role="group"
          aria-label="Feedback tags"
        >
          {tagOptions.map((tag) => {
            const isChecked = tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={isChecked}
                disabled={submitting}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'type-b3-regular rounded-full border px-2.5 py-1 transition-colors duration-150 disabled:cursor-not-allowed',
                  isChecked
                    ? 'border-[#4F6BED] bg-[#4F6BED]/10 text-[#4F6BED]'
                    : 'border-border bg-surface text-foreground-subtle hover:bg-surface-muted',
                )}
              >
                {tag}
              </button>
            )
          })}
        </div>
      ) : null}

      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX_FEEDBACK_LENGTH}
        disabled={submitting}
        placeholder="Share what worked or what could be better (optional)"
        className="mt-2"
      />
      <div className="mt-3 flex justify-end">
        <MasaiButton
          type="primary"
          size="md"
          htmlType="button"
          ctaText={savedRating != null ? 'Update feedback' : 'Submit feedback'}
          disabled={rating < 1 || submitting}
          onClick={handleSubmit}
          className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#4F6BED]/20 active:translate-y-0 active:scale-[0.98]"
        />
      </div>
    </section>
  )
}
