import { UPCOMING_EVENTS_DUMMY_DATA } from '../../../data/upcomingEventsDummyData'

export default function UpcomingEvents() {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
        Upcoming events
      </p>
      <div className="flex flex-col gap-4">
        {UPCOMING_EVENTS_DUMMY_DATA.map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex w-7 shrink-0 flex-col items-center leading-none">
              <span className="text-[16px] font-bold text-[#111827]">
                {event.day}
              </span>
              <span className="text-[10px] font-semibold text-[#9CA3AF]">
                {event.month}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-bold leading-5 text-[#111827]">
                  {event.title}
                </p>
                <span className="shrink-0 rounded-full bg-masaiverse-orange/15 px-2 py-0.5 text-[11px] font-semibold text-masaiverse-orange">
                  {event.ctaLabel}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-4 text-[#6B7280]">
                {event.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
