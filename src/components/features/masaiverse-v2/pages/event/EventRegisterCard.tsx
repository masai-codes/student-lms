import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowSquareOut,
  CheckCircle,
  MapPin,
  Plus,
  Ticket,
} from '@phosphor-icons/react'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'
import EventAttendees from './EventAttendees'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import type { EventEnrollmentState } from '@/server/api/masaiverse-v2/services/setEventEnrollment.service'
import ConfirmActionModal from '@/components/features/masaiverse-v2/ConfirmActionModal'
import {
  enrollMasaiverseV2Event,
  setMasaiverseV2ClubMembership,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { masaiverseV2EventDetailQuery } from '@/query/masaiverse-v2/eventsQuery'
import {
  MASAIVERSE_V2_MY_CLUBS_KEY,
  masaiverseV2ClubDetailQuery,
} from '@/query/masaiverse-v2/clubsQuery'
import { MASAIVERSE_V2_HOME_KEY } from '@/query/masaiverse-v2/homeQuery'
import { invalidateMasaiverseV2Leaderboards } from '@/query/masaiverse-v2/leaderboardQuery'

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
  const [justRegistered, setJustRegistered] =
    useState<EventEnrollmentState | null>(null)
  // Whether the pre-registration confirmation dialog is open. Only ever shown
  // when the event configures `confirmationModalText`.
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Local club-membership flip so the Register CTA appears instantly after the
  // user joins the club from this page, without waiting for a detail refetch.
  const [justJoinedClub, setJustJoinedClub] = useState(false)
  // Whether the pre-join confirmation dialog is open. Only ever shown when the
  // hosting club configures `clubConfirmationModalText`.
  const [joinConfirmOpen, setJoinConfirmOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: () => enrollMasaiverseV2Event(event.id),
    onSuccess: (state) => {
      trackMasaiverse(MASAIVERSE_EVENTS.eventRegisterSuccess, {
        event_id: event.id,
        mode: event.mode,
        club_id: event.clubId,
      })
      setConfirmOpen(false)
      setJustRegistered(state)
      queryClient.setQueryData<MasaiverseV2EventDetail>(detailKey, (prev) =>
        prev
          ? { ...prev, isEnrolled: true, enrolledCount: state.enrolledCount }
          : prev,
      )
      // The home + events lists embed this event's enrollment status; mark them
      // stale so the "Registered" label is correct when the user navigates back.
      void queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_HOME_KEY })
      void queryClient.invalidateQueries({
        queryKey: ['masaiverse-v2', 'events'],
      })
      // First-time registration awards leaderboard points; refresh standings.
      invalidateMasaiverseV2Leaderboards(queryClient)
    },
  })

  // Joins the hosting club so the user can then register. Flips the local +
  // cached membership state and refreshes the club's own page / sidebar list.
  const joinMutation = useMutation({
    mutationFn: () =>
      setMasaiverseV2ClubMembership({ clubId: event.clubId!, join: true }),
    onSuccess: () => {
      trackMasaiverse(MASAIVERSE_EVENTS.clubJoinSuccess, {
        club_id: event.clubId,
      })
      setJoinConfirmOpen(false)
      setJustJoinedClub(true)
      queryClient.setQueryData<MasaiverseV2EventDetail>(detailKey, (prev) =>
        prev ? { ...prev, isClubMember: true } : prev,
      )
      // The club's own page (member count, locked sections) and the sidebar
      // "My Clubs" list now reflect the new membership.
      if (event.clubId) {
        void queryClient.invalidateQueries({
          queryKey: masaiverseV2ClubDetailQuery(event.clubId).queryKey,
        })
      }
      void queryClient.invalidateQueries({
        queryKey: MASAIVERSE_V2_MY_CLUBS_KEY,
      })
    },
  })

  // Gate joining behind the confirmation dialog when the club provides notice
  // text; otherwise join straight away.
  const handleJoinClick = () => {
    trackMasaiverse(MASAIVERSE_EVENTS.clubJoinClick, {
      club_id: event.clubId,
      has_confirmation: Boolean(event.clubConfirmationModalText),
    })
    if (event.clubConfirmationModalText) setJoinConfirmOpen(true)
    else joinMutation.mutate()
  }

  // Gate registration behind the confirmation dialog when the event provides
  // notice text; otherwise register straight away.
  const handleRegisterClick = () => {
    trackMasaiverse(MASAIVERSE_EVENTS.eventRegisterClick, {
      event_id: event.id,
      mode: event.mode,
      has_confirmation: Boolean(event.confirmationModalText),
    })
    if (event.confirmationModalText) setConfirmOpen(true)
    else mutation.mutate()
  }

  const isEnrolled = event.isEnrolled || justRegistered !== null
  const enrolledCount = justRegistered?.enrolledCount ?? event.enrolledCount
  const openLabel = isOffline ? 'Get directions' : 'Join event'
  const OpenIcon = isOffline ? MapPin : ArrowSquareOut
  // Registration is members-only. When the event belongs to a club the user
  // hasn't joined, the Register CTA is replaced by a "Join club" CTA; once the
  // user joins, the Register CTA takes its place.
  const isClubMember = event.isClubMember || justJoinedClub
  const needsClubMembership = event.clubId != null && !isClubMember

  return (
    <div className="rounded-[20px] border border-border bg-surface/95 p-5 shadow-[0_10px_40px_-18px_rgba(0,0,0,0.28)] backdrop-blur-sm">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-foreground-subtle">
        Registration
      </p>

      {event.status === 'completed' ? (
        <p className="mt-3 text-[14px] leading-5 text-foreground-muted">
          This event has ended.
        </p>
      ) : isEnrolled ? (
        <div className="mt-3">
          <div className="flex flex-col items-center rounded-[14px] border border-success-subtle bg-gradient-to-b from-[#F0FDF4] to-white px-4 py-5 text-center dark:bg-none dark:bg-success-subtle">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle text-success"
              aria-hidden="true"
            >
              <CheckCircle size={32} weight="fill" />
            </span>
            <p className="mt-3 text-[16px] font-bold text-success">
              You're registered! 🎉
            </p>
            <p className="mt-1 text-[13px] leading-5 text-foreground-muted">
              Your spot is saved. We can't wait to see you there ✨
            </p>
          </div>
          {link ? (
            <button
              type="button"
              onClick={() => {
                trackMasaiverse(MASAIVERSE_EVENTS.eventExternalLinkClick, {
                  event_id: event.id,
                  link_type: isOffline ? 'directions' : 'join',
                })
                openExternal(link)
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-accent-warm to-[#FF7A29] px-5 py-3.5 text-[15px] font-bold text-accent-warm-foreground shadow-[0_8px_20px_-6px_rgba(242,92,4,0.5)] transition-all hover:shadow-[0_10px_26px_-6px_rgba(242,92,4,0.6)] active:scale-[0.99]"
            >
              <OpenIcon size={18} weight="bold" />
              {openLabel}
            </button>
          ) : null}
        </div>
      ) : needsClubMembership ? (
        <div className="mt-3">
          <p className="text-[14px] leading-5 text-foreground-muted">
            Join{' '}
            <span className="font-semibold text-foreground">
              {event.clubName ?? 'the club'}
            </span>{' '}
            to register for this event.
          </p>
          <button
            type="button"
            onClick={handleJoinClick}
            disabled={joinMutation.isPending}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-accent-warm to-[#FF7A29] px-5 py-3.5 text-[15px] font-bold text-accent-warm-foreground shadow-[0_8px_20px_-6px_rgba(242,92,4,0.5)] transition-all hover:shadow-[0_10px_26px_-6px_rgba(242,92,4,0.6)] active:scale-[0.99] disabled:opacity-70 disabled:shadow-none"
          >
            <Plus size={18} weight="bold" />
            {joinMutation.isPending ? 'Joining…' : 'Join club'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRegisterClick}
          disabled={mutation.isPending}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-accent-warm to-[#FF7A29] px-5 py-3.5 text-[15px] font-bold text-accent-warm-foreground shadow-[0_8px_20px_-6px_rgba(242,92,4,0.5)] transition-all hover:shadow-[0_10px_26px_-6px_rgba(242,92,4,0.6)] active:scale-[0.99] disabled:opacity-70 disabled:shadow-none"
        >
          <Ticket size={18} weight="fill" />
          {mutation.isPending ? 'Registering…' : 'Register'}
        </button>
      )}

      <EventAttendees count={enrolledCount} />

      {event.confirmationModalText ? (
        <ConfirmActionModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          confirmationText={event.confirmationModalText}
          title="Confirm your registration"
          confirmLabel={
            mutation.isPending ? 'Registering…' : 'Confirm & register'
          }
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutate()}
        />
      ) : null}

      {event.clubConfirmationModalText ? (
        <ConfirmActionModal
          open={joinConfirmOpen}
          onOpenChange={setJoinConfirmOpen}
          confirmationText={event.clubConfirmationModalText}
          title="Confirm joining this club"
          confirmLabel={joinMutation.isPending ? 'Joining…' : 'Confirm & join'}
          isPending={joinMutation.isPending}
          onConfirm={() => joinMutation.mutate()}
        />
      ) : null}
    </div>
  )
}
