import { Link } from '@tanstack/react-router'
import { CheckCircle } from '@phosphor-icons/react'
import type { MasaiverseV2HomeEvent } from '@/server/api/masaiverse-v2/services/getHomeEvents.service'
import { getEventCardDisplay } from '@/lib/masaiverseEventCard'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type EventCardProps = {
  event: MasaiverseV2HomeEvent
  /** Injectable clock for deterministic rendering/tests. */
  now?: Date
}

export default function EventCard({ event, now = new Date() }: EventCardProps) {
  const { isLive, badgeLabel, dateDay, dateMonth } = getEventCardDisplay(
    event,
    now,
  )

  return (
    <Link
      to="/masaiverse/event/$eventId"
      params={{ eventId: event.id }}
      search={(prev) => prev}
      onClick={() =>
        trackMasaiverse(MASAIVERSE_EVENTS.eventCardClick, {
          event_id: event.id,
          source: 'home_events',
        })
      }
      className="flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-surface transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]"
    >
      <div className="relative h-[116px] bg-[#241C16]">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="size-full object-cover"
          />
        ) : null}

        {badgeLabel ? (
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase leading-none ${
              isLive
                ? 'bg-danger text-danger-foreground'
                : 'bg-accent-warm text-accent-warm-foreground'
            }`}
          >
            {isLive ? (
              <span className="size-1.5 rounded-full bg-danger-foreground" />
            ) : null}
            {badgeLabel}
          </span>
        ) : null}

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

      <div className="flex flex-1 flex-col p-3">
        {event.aboveTitle ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">
            {event.aboveTitle}
          </p>
        ) : null}
        <p className="mt-1 text-[15px] font-bold leading-5 text-foreground">
          {event.title}
        </p>
        {event.belowTitle ? (
          <p className="mt-1 text-[13px] leading-5 text-foreground-muted">
            {event.belowTitle}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
