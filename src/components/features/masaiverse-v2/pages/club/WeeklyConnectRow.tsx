import { Link } from '@tanstack/react-router'
import type { MasaiverseV2WeeklyConnect } from '@/server/api/masaiverse-v2/services/getClubWeeklyConnects.service'
import { formatIstDayBadge, getEventStatus } from '@/lib/masaiverseEventCard'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type WeeklyConnectRowProps = {
  connect: MasaiverseV2WeeklyConnect
  /** Injectable clock for deterministic rendering/tests. */
  now?: Date
}

const BADGE_STYLES = {
  live: 'bg-masaiverse-orange/10 text-masaiverse-orange',
  upcoming: 'bg-masaiverse-orange/10 text-masaiverse-orange',
  completed: 'bg-[#F3F4F6] text-[#9CA3AF]',
} as const

const PILL_STYLES = {
  live: 'bg-[#FEE2E2] text-[#DC2626]',
  upcoming: 'bg-masaiverse-orange/10 text-masaiverse-orange',
  completed: 'bg-[#F3F4F6] text-[#9CA3AF]',
} as const

const PILL_LABELS = {
  live: 'Live Now',
  upcoming: 'Upcoming',
  completed: 'Completed',
} as const

export default function WeeklyConnectRow({
  connect,
  now = new Date(),
}: WeeklyConnectRowProps) {
  const status = getEventStatus(connect, now)
  const badge = formatIstDayBadge(connect.startTime)
  const isMuted = status === 'completed'

  return (
    <Link
      to="/masaiverse/event/$eventId"
      params={{ eventId: connect.id }}
      search={(prev) => prev}
      onClick={() =>
        trackMasaiverse(MASAIVERSE_EVENTS.eventCardClick, {
          event_id: connect.id,
          source: 'weekly_connect',
        })
      }
      className="flex h-full items-center gap-4 rounded-[16px] border border-[#EDEAE8] bg-white p-4 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]"
    >
      <span
        className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-[12px] leading-none ${BADGE_STYLES[status]}`}
      >
        {badge ? (
          <>
            <span className="text-[11px] font-bold uppercase">
              {badge.weekday}
            </span>
            <span className="mt-0.5 text-[20px] font-extrabold">
              {badge.day}
            </span>
          </>
        ) : (
          <span className="text-[16px]">📅</span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`text-[16px] font-bold leading-5 ${
            isMuted ? 'text-[#6B7280]' : 'text-[#111827]'
          }`}
        >
          {connect.title}
        </p>
        {connect.subtitle ? (
          <p className="mt-1 text-[14px] leading-5 text-[#9CA3AF]">
            {connect.subtitle}
          </p>
        ) : null}
      </div>

      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${PILL_STYLES[status]}`}
      >
        {status === 'live' ? (
          <span className="size-1.5 rounded-full bg-[#DC2626]" />
        ) : null}
        {PILL_LABELS[status]}
      </span>
    </Link>
  )
}
