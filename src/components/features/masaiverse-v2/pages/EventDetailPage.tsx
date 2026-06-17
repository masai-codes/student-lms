import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, CopySimple, PencilSimple } from '@phosphor-icons/react'
import InlineDrawer from '../InlineDrawer'
import EventHeroImage from './event/EventHeroImage'
import EventHosts from './event/EventHosts'
import EventInfoRows from './event/EventInfoRows'
import EventRatingCard from './event/EventRatingCard'
import EventRegisterCard from './event/EventRegisterCard'
import type { MasaiverseV2EventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import { RichContent } from '@/components/event-card/rich-content'
import { ApiClientError } from '@/lib/api/apiClientError'
import { cloneMasaiverseV2Event } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { masaiverseV2EventDetailQuery } from '@/query/masaiverse-v2/eventsQuery'
import { masaiverseV2AdminModeQuery } from '@/query/masaiverse-v2/adminModeQuery'
import { MASAIVERSE_V2_HOME_KEY } from '@/query/masaiverse-v2/homeQuery'
import EventEditForm from '@/components/features/masaiverse-v2/edit/EventEditForm'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

type EventDetailPageProps = {
  eventId: string
}

/** True once the event's end time (UTC ISO) is in the past. */
function eventHasEnded(endTime: string | null): boolean {
  if (!endTime) return false
  const end = new Date(endTime)
  return !Number.isNaN(end.getTime()) && end.getTime() <= Date.now()
}

/**
 * Returns the user to wherever they opened this event from (home, a club page,
 * the calendar, the events list, …) via the router history. Falls back to the
 * events list when there's no in-app history — e.g. on a direct/shared link.
 */
function BackToEventsLink() {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  const handleBack = () => {
    trackMasaiverse(MASAIVERSE_EVENTS.backClick, { to: 'events' })
    if (canGoBack) {
      router.history.back()
    } else {
      void navigate({ to: '/masaiverse/events', search: (prev) => prev })
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]"
    >
      <ArrowLeft size={16} />
      Back to events
    </button>
  )
}

/** Category / weekly-connect / mode pills shown under the title. */
function EventPills({ event }: { event: MasaiverseV2EventDetail }) {
  const labels: Array<string> = []
  if (event.isWeeklyConnect) labels.push('Weekly Connect')
  // `capitalize` upper-cases each word, so swap underscores for spaces first
  // (e.g. `offline_meetup` → "Offline Meetup").
  if (event.category) labels.push(event.category.replace(/_/g, ' '))
  if (event.mode) labels.push(event.mode === 'online' ? 'Online' : 'In-person')
  if (labels.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full bg-masaiverse-orange/10 px-3 py-1 text-[12px] font-semibold capitalize text-masaiverse-orange"
        >
          {label}
        </span>
      ))}
    </div>
  )
}

/**
 * Luma-style event registration page. In admin mode an "Edit event" button opens
 * a right drawer that edits every field (with online/offline-conditional rows).
 * Data is fetched live by `eventId`.
 */
export default function EventDetailPage({ eventId }: EventDetailPageProps) {
  const { data: event, isPending, error } = useQuery(
    masaiverseV2EventDetailQuery(eventId),
  )
  const { data: adminMode } = useQuery(masaiverseV2AdminModeQuery())
  const canEdit = adminMode?.enabled ?? false
  const [isEditOpen, setIsEditOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Clones this event into a fresh draft, refreshes the lists it shows up in,
  // then opens the new draft so the admin can edit it right away.
  const cloneMutation = useMutation({
    mutationFn: () => cloneMasaiverseV2Event(eventId),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: ['masaiverse-v2', 'events'] })
      void queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_HOME_KEY })
      void navigate({ to: '/masaiverse/event/$eventId', params: { eventId: id } })
    },
  })

  if (isPending) {
    return (
      <div>
        <BackToEventsLink />
        <div
          role="status"
          aria-label="Loading event"
          className="mt-4 h-72 animate-pulse rounded-[20px] bg-[#ECE7E2]"
        >
          <span className="sr-only">Loading event…</span>
        </div>
      </div>
    )
  }

  if (error) {
    const notFound = error instanceof ApiClientError && error.status === 404
    return (
      <div>
        <BackToEventsLink />
        <h2 className="mt-4 text-[20px] font-bold leading-7 text-[#111827]">
          {notFound ? 'Event not found' : 'Something went wrong'}
        </h2>
        <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
          {notFound
            ? `We couldn't find an event with id "${eventId}".`
            : "We couldn't load this event. Please try again."}
        </p>
      </div>
    )
  }

  return (
    <InlineDrawer
      open={isEditOpen}
      panel={
        isEditOpen ? (
          <EventEditForm eventId={eventId} onClose={() => setIsEditOpen(false)} />
        ) : null
      }
      panelWidth={460}
      title="Edit event"
      onClose={() => setIsEditOpen(false)}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <BackToEventsLink />
          {canEdit ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  trackMasaiverse(MASAIVERSE_EVENTS.eventCloneClick, {
                    event_id: eventId,
                  })
                  cloneMutation.mutate()
                }}
                disabled={cloneMutation.isPending}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#111827] px-3.5 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#111827] hover:text-white disabled:opacity-60"
              >
                <CopySimple size={16} weight="bold" />
                {cloneMutation.isPending ? 'Cloning…' : 'Clone event'}
              </button>
              <button
                type="button"
                onClick={() => {
                  trackMasaiverse(MASAIVERSE_EVENTS.eventEditClick, {
                    event_id: eventId,
                  })
                  setIsEditOpen(true)
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#111827] px-3.5 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#111827] hover:text-white"
              >
                <PencilSimple size={16} weight="bold" />
                Edit event
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5 md:sticky md:top-4 md:self-start">
            <EventHeroImage event={event} />
            <EventHosts hosts={event.hostedBy} />
          </div>

          <div className="flex flex-col gap-5">
            <div>
              {event.aboveTitle ? (
                <p className="text-[12px] font-semibold uppercase tracking-wide text-masaiverse-orange">
                  {event.aboveTitle}
                </p>
              ) : null}
              <h1 className="mt-1 text-[28px] font-extrabold leading-9 text-[#111827] sm:text-[32px]">
                {event.title}
              </h1>
              {event.belowTitle ? (
                <p className="mt-1.5 text-[15px] leading-6 text-[#6B7280]">
                  {event.belowTitle}
                </p>
              ) : null}
              {event.clubName ? (
                <p className="mt-2 text-[14px] leading-5 text-[#6B7280]">
                  Hosted by{' '}
                  <span className="font-semibold text-[#111827]">
                    {event.clubName}
                  </span>
                </p>
              ) : null}
              <EventPills event={event} />
            </div>

            <EventInfoRows event={event} />
            <EventRegisterCard event={event} />
            <EventRatingCard event={event} />

            {event.eventSummary && eventHasEnded(event.endTime) ? (
              <section>
                <h2 className="text-[16px] font-bold leading-6 text-[#111827]">
                  Event summary
                </h2>
                <RichContent
                  value={event.eventSummary}
                  className="mt-2 text-[14px] leading-6 text-[#4B5563]"
                />
              </section>
            ) : null}

            {event.description ? (
              <section>
                <h2 className="text-[16px] font-bold leading-6 text-[#111827]">
                  About this event
                </h2>
                <RichContent
                  value={event.description}
                  className="mt-2 text-[14px] leading-6 text-[#4B5563]"
                />
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </InlineDrawer>
  )
}
