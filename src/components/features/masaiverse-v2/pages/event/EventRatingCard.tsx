import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from '@phosphor-icons/react'
import StarRow from './StarRow'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import { rateMasaiverseV2Event } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { masaiverseV2EventDetailQuery } from '@/query/masaiverse-v2/eventsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type EventRatingCardProps = {
  event: MasaiverseV2EventDetail
}

const RATING_LABELS = ['', 'Not great', 'Could be better', 'Good', 'Great', 'Loved it!']

/**
 * Post-event rating card. Visible only to a registered user once the event has
 * ended. Offers an animated star picker plus optional feedback; a rating can be
 * submitted only once, after which it flips to a celebratory thank-you state.
 */
export default function EventRatingCard({ event }: EventRatingCardProps) {
  const queryClient = useQueryClient()
  const detailKey = masaiverseV2EventDetailQuery(event.id).queryKey

  const [selected, setSelected] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [feedback, setFeedback] = useState('')
  // Local mirror so the thank-you state shows instantly on success, regardless
  // of how the surrounding page re-renders off the query cache.
  const [submitted, setSubmitted] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      rateMasaiverseV2Event({
        eventId: event.id,
        rating: selected,
        feedback: feedback.trim() || undefined,
      }),
    onSuccess: (state) => {
      trackMasaiverse(MASAIVERSE_EVENTS.eventRatingSubmit, {
        event_id: event.id,
        rating: state.rating,
      })
      setSubmitted(state.rating)
      queryClient.setQueryData<MasaiverseV2EventDetail>(detailKey, (prev) =>
        prev
          ? { ...prev, userRating: state.rating, userFeedback: state.feedback }
          : prev,
      )
    },
  })

  // Only attendees of an ended event can rate it.
  if (event.status !== 'completed' || !event.isEnrolled) return null

  const existingRating = submitted ?? event.userRating
  const isRated = existingRating != null

  if (isRated) {
    const note = submitted != null ? feedback.trim() : event.userFeedback
    return (
      <div className="rounded-[16px] border border-[#FCD9A8] bg-gradient-to-b from-[#FFF7ED] to-white p-5 text-center">
        <p className="text-[24px]" aria-hidden="true">
          🌟
        </p>
        <p className="mt-1 text-[16px] font-bold text-[#B45309]">
          Thanks for rating!
        </p>
        <div className="mt-2 flex justify-center">
          <StarRow value={existingRating} readOnly />
        </div>
        {note ? (
          <p className="mt-3 rounded-[10px] bg-white/70 px-3 py-2 text-left text-[13px] leading-5 text-[#6B7280]">
            “{note}”
          </p>
        ) : null}
      </div>
    )
  }

  const active = hovered || selected
  return (
    <div className="rounded-[16px] border border-[#EDEAE8] bg-white p-5">
      <div className="flex items-center gap-2">
        <Star size={20} weight="fill" className="text-amber-400" />
        <p className="text-[15px] font-bold text-[#111827]">
          How was the event?
        </p>
      </div>
      <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
        Tap a star to rate — you can only rate once.
      </p>

      <div
        className="mt-4 flex justify-center"
        onMouseLeave={() => setHovered(0)}
      >
        <StarRow
          value={selected}
          hovered={hovered}
          onHover={setHovered}
          onSelect={setSelected}
        />
      </div>
      <p className="mt-2 h-5 text-center text-[13px] font-semibold text-amber-500 transition-opacity duration-200">
        {RATING_LABELS[active]}
      </p>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Share what you liked or what we can improve (optional)"
        className="mt-2 w-full resize-none rounded-[12px] border border-[#EDEAE8] px-3 py-2 text-[14px] leading-5 text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-masaiverse-orange"
      />

      {mutation.isError ? (
        <p className="mt-2 text-[13px] text-[#DC2626]">
          Couldn't submit your rating. Please try again.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={selected === 0 || mutation.isPending}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] bg-masaiverse-orange px-5 py-3 text-[15px] font-bold text-white transition-colors hover:bg-masaiverse-orange-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? 'Submitting…' : 'Submit rating'}
      </button>
    </div>
  )
}
