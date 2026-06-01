import type { MasaiverseWeekEvent } from '../../types'

type EventCardProps = {
  event: MasaiverseWeekEvent
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-[#EDEAE8] bg-white">
      <div
        className="relative h-[116px] p-3"
        style={{ backgroundColor: event.bannerColor }}
      >
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase leading-none text-white ${
            event.isLive ? 'bg-[#EF4444]' : 'bg-[#EF8833]'
          }`}
        >
          {event.isLive ? (
            <span className="size-1.5 rounded-full bg-white" />
          ) : null}
          {event.badgeLabel}
        </span>

        <span className="absolute right-3 top-3 flex flex-col items-center rounded-[8px] bg-white px-2 py-1 leading-none">
          <span className="text-[15px] font-bold text-[#111827]">
            {event.dateDay}
          </span>
          <span className="text-[9px] font-semibold text-[#6B7280]">
            {event.dateMonth}
          </span>
        </span>

        <span className="absolute inset-0 flex items-center justify-center text-[36px]">
          {event.emoji}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
          {event.category}
        </p>
        <p className="mt-1 text-[15px] font-bold leading-5 text-[#111827]">
          {event.title}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-[#6B7280]">
          {event.subtitle}
        </p>
      </div>
    </div>
  )
}
