import { useQuery } from '@tanstack/react-query'
import ResponsiveCardCarousel from '../home/ResponsiveCardCarousel'
import SectionHeader from '../home/SectionHeader'
import { repeat } from '../home/skeletons'
import WeeklyConnectRow from './WeeklyConnectRow'
import type { MasaiverseV2WeeklyConnect } from '@/server/api/masaiverse-v2/services/getClubWeeklyConnects.service'
import type { MasaiverseV2ClubEvents } from '@/server/api/masaiverse-v2/services/getClubEvents.service'
import { masaiverseV2ClubEventsQuery } from '@/query/masaiverse-v2/clubsQuery'
import { getEventStatus } from '@/lib/masaiverseEventCard'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

type WeeklyConnectsSectionProps = {
  clubId: string
  /** Toggles the calendar/schedule drawer. */
  onViewSchedule?: () => void
  /** Whether the schedule drawer is currently open (toggles the CTA label). */
  scheduleOpen?: boolean
  /** Injectable clock for deterministic rendering/tests. */
  now?: Date
  /** Events embedded in the club detail payload; seeds the query. */
  initialEvents?: MasaiverseV2ClubEvents
}

const STATUS_ORDER = { live: 0, upcoming: 1, completed: 2 } as const

/** Live first, then upcoming soonest-first, then completed most-recent-first. */
function sortConnects(
  connects: Array<MasaiverseV2WeeklyConnect>,
  now: Date,
): Array<MasaiverseV2WeeklyConnect> {
  return [...connects].sort((a, b) => {
    const statusA = getEventStatus(a, now)
    const statusB = getEventStatus(b, now)
    if (STATUS_ORDER[statusA] !== STATUS_ORDER[statusB]) {
      return STATUS_ORDER[statusA] - STATUS_ORDER[statusB]
    }
    const startA = a.startTime ? Date.parse(a.startTime) : 0
    const startB = b.startTime ? Date.parse(b.startTime) : 0
    return statusA === 'completed' ? startB - startA : startA - startB
  })
}

export default function WeeklyConnectsSection({
  clubId,
  onViewSchedule,
  scheduleOpen = false,
  now = new Date(),
  initialEvents,
}: WeeklyConnectsSectionProps) {
  const { data, isPending } = useQuery({
    ...masaiverseV2ClubEventsQuery(clubId),
    ...(initialEvents ? { initialData: initialEvents } : {}),
  })
  const connects = sortConnects(data?.weeklyConnects ?? [], now)

  return (
    <section>
      <SectionHeader
        title="Weekly Connects"
        action={
          <button
            type="button"
            onClick={() => {
              trackMasaiverse(MASAIVERSE_EVENTS.calendarOpen, {
                source: 'weekly_connects',
                club_id: clubId,
              })
              onViewSchedule?.()
            }}
            className="text-[14px] font-medium text-accent-warm hover:underline"
          >
            {scheduleOpen ? 'Hide schedule →' : 'See schedule →'}
          </button>
        }
      />
      {isPending ? (
        <div
          role="status"
          aria-label="Loading weekly connects"
          className="flex flex-col gap-3"
        >
          <span className="sr-only">Loading weekly connects…</span>
          {repeat(3, (key) => (
            <div
              key={key}
              className="h-[84px] animate-pulse rounded-[16px] bg-surface-muted"
            />
          ))}
        </div>
      ) : connects.length === 0 ? (
        <p className="text-[14px] text-foreground-muted">
          No weekly connects scheduled yet.
        </p>
      ) : (
        <ResponsiveCardCarousel
          items={connects}
          getKey={(connect) => connect.id}
          navKey="weekly-connects"
          navLabel="weekly connects"
          // One wide row at a time on phones, easing up to ~two on desktop.
          slidesPerView={1.05}
          breakpoints={{
            768: { slidesPerView: 1.8 },
            1024: { slidesPerView: 2.2 },
          }}
          renderItem={(connect) => (
            <WeeklyConnectRow connect={connect} now={now} />
          )}
        />
      )}
    </section>
  )
}
