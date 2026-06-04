import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowSquareOut, CheckCircle, MapPin } from '@phosphor-icons/react'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import type { EventEnrollmentState } from '@/server/api/masaiverse-v2/services/setEventEnrollment.service'
import { enrollMasaiverseV2Event } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { masaiverseV2EventDetailQuery } from '@/query/masaiverse-v2/eventsQuery'

type EventRegisterCardProps = {
  event: MasaiverseV2EventDetail
}

/** Opens an external URL in a new, opener-isolated tab. */
function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * The post-registration destination: directions for offline events, the join
 * link for online ones. Null when the relevant link is unset.
 */
function getEventLink(event: MasaiverseV2EventDetail): string | null {
  return event.mode === 'offline' ? event.locationMapLink : event.eventLink
}

/**
 * Luma-style registration card. Registers the user and shows a celebratory
 * confirmation in place — it never navigates or opens links automatically.
 * Registered users get a green-check confirmation plus an optional button to
 * open the event link or directions themselves; ended events are disabled.
 */
export default function EventRegisterCard({ event }: EventRegisterCardProps) {
  const queryClient = useQueryClient()
  const detailKey = masaiverseV2EventDetailQuery(event.id).queryKey
  const isOffline = event.mode === 'offline'
  const link = getEventLink(event)

  // Local confirmation so the success UI flips instantly on this page, even if
  // the cached detail this card was rendered from isn't the same query the
  // surrounding page re-renders off of (e.g. on client-side navigation).
  const [justRegistered, setJustRegistered] = useState<EventEnrollmentState | null>(
    null,
  )

  const mutation = useMutation({
    mutationFn: () => enrollMasaiverseV2Event(event.id),
    onSuccess: (state) => {
      setJustRegistered(state)
      queryClient.setQueryData<MasaiverseV2EventDetail>(detailKey, (prev) =>
        prev
          ? { ...prev, isEnrolled: true, enrolledCount: state.enrolledCount }
          : prev,
      )
    },
  })

  const isEnrolled = event.isEnrolled || justRegistered !== null
  const enrolledCount = justRegistered?.enrolledCount ?? event.enrolledCount
  const openLabel = isOffline ? 'Get directions' : 'Join event'
  const OpenIcon = isOffline ? MapPin : ArrowSquareOut

  return (
    <div className="rounded-[16px] border border-[#EDEAE8] bg-white p-5">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        Registration
      </p>

      {event.status === 'completed' ? (
        <p className="mt-3 text-[14px] leading-5 text-[#6B7280]">
          This event has ended.
        </p>
      ) : isEnrolled ? (
        <div className="mt-3">
          <div className="flex flex-col items-center rounded-[14px] border border-[#BBF7D0] bg-gradient-to-b from-[#F0FDF4] to-white px-4 py-5 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]"
              aria-hidden="true"
            >
              <CheckCircle size={32} weight="fill" />
            </span>
            <p className="mt-3 text-[16px] font-bold text-[#15803D]">
              You're registered! 🎉
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[#4B5563]">
              Your spot is saved. We can't wait to see you there ✨
            </p>
          </div>
          {link ? (
            <button
              type="button"
              onClick={() => openExternal(link)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] bg-masaiverse-orange px-5 py-3 text-[15px] font-bold text-white transition-colors hover:bg-masaiverse-orange-dark"
            >
              <OpenIcon size={18} weight="bold" />
              {openLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] bg-masaiverse-orange px-5 py-3 text-[15px] font-bold text-white transition-colors hover:bg-masaiverse-orange-dark disabled:opacity-70"
        >
          {mutation.isPending ? 'Registering…' : 'Register'}
        </button>
      )}

      <p className="mt-3 text-[13px] text-[#6B7280]">
        {enrolledCount === 0
          ? 'Be the first to register'
          : `${enrolledCount.toLocaleString('en-IN')} ${
              enrolledCount === 1 ? 'person' : 'people'
            } registered`}
      </p>
    </div>
  )
}
