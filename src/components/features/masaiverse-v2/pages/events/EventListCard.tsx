import { Link } from '@tanstack/react-router'
import {
  CalendarBlank,
  CheckCircle,
  Globe,
  MapPin,
  UsersThree,
  VideoCamera,
} from '@phosphor-icons/react'
import type { MasaiverseV2EventListItem } from '@/server/api/masaiverse-v2/services/getEventsList.service'
import {
  formatLocalDateTime,
  getEventCardDisplay,
  getEventStatus,
} from '@/lib/masaiverseEventCard'
import { cn } from '@/lib/utils'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type EventListCardProps = {
  event: MasaiverseV2EventListItem
  /** Injectable clock for deterministic rendering/tests. */
  now?: Date
}

/** Human label for the category pill, keyed off `events.category`. */
const CATEGORY_LABEL: Record<string, string> = {
  hackathon: 'Hackathon',
  meetup: 'Meetup',
  webinar: 'Webinar',
  session: 'Session',
  challenge: 'Challenge',
  contest: 'Contest',
  workshop: 'Workshop',
  offline_meetup: 'Offline Meetup',
}

export default function EventListCard({
  event,
  now = new Date(),
}: EventListCardProps) {
  const status = getEventStatus(event, now)
  const { isLive, badgeLabel, dateDay, dateMonth } = getEventCardDisplay(
    event,
    now,
  )
  const isPast = status === 'completed'
  const dateTimeLine = formatLocalDateTime(event.startTime)

  return (
    <Link
      to="/masaiverse/event/$eventId"
      params={{ eventId: event.id }}
      search={(prev) => prev}
      onClick={() =>
        trackMasaiverse(MASAIVERSE_EVENTS.eventCardClick, {
          event_id: event.id,
          source: 'events_list',
        })
      }
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-surface transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]',
        isPast && 'opacity-90',
      )}
    >
      <div className="relative h-[120px] bg-[#241C16]">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className={cn(
              'size-full object-cover',
              isPast && 'grayscale-[35%]',
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#3A2A1E] to-[#241C16]">
            <CalendarBlank
              size={28}
              weight="duotone"
              className="text-white/40"
            />
          </div>
        )}

        <span
          className={cn(
            'absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase leading-none',
            isLive
              ? 'bg-danger text-danger-foreground'
              : isPast
                ? 'bg-black/55 text-white'
                : 'bg-accent-warm text-accent-warm-foreground',
          )}
        >
          {isLive ? (
            <span className="size-1.5 rounded-full bg-danger-foreground" />
          ) : null}
          {isPast ? 'Ended' : badgeLabel}
        </span>

        {dateDay ? (
          <span className="absolute right-3 top-3 flex flex-col items-center rounded-[8px] bg-surface px-2 py-1 leading-none">
            <span className="text-[15px] font-bold text-foreground">
              {dateDay}
            </span>
            <span className="text-[9px] font-semibold text-foreground-muted">
              {dateMonth}
            </span>
          </span>
        ) : null}

        {event.isEnrolled ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[11px] font-bold leading-none text-success-foreground shadow-sm">
            <CheckCircle size={13} weight="fill" />
            Registered
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <HostBadge clubName={event.clubName} />
          {event.category ? (
            <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-foreground-muted">
              {CATEGORY_LABEL[event.category]}
            </span>
          ) : null}
        </div>

        <p className="text-[15px] font-bold leading-5 text-foreground">
          {event.title}
        </p>

        <div className="mt-auto flex flex-col gap-1 text-[12px] text-foreground-muted">
          {dateTimeLine ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank size={14} weight="bold" />
              {dateTimeLine}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            {event.mode === 'online' ? (
              <>
                <VideoCamera size={14} weight="bold" />
                Online
              </>
            ) : (
              <>
                <MapPin size={14} weight="bold" />
                {event.locationTitle ?? 'Venue to be announced'}
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}

/** "Community" for public events, the club name for club-hosted ones. */
function HostBadge({ clubName }: { clubName: string | null }) {
  if (clubName) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-info-subtle px-2 py-0.5 text-[11px] font-semibold text-info-subtle-foreground">
        <UsersThree size={12} weight="fill" />
        {clubName}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-warm/12 px-2 py-0.5 text-[11px] font-semibold text-accent-warm">
      <Globe size={12} weight="fill" />
      Community
    </span>
  )
}
