import { useQuery } from '@tanstack/react-query'
import SectionHeader from '../home/SectionHeader'
import { repeat } from '../home/skeletons'
import WeeklyConnectRow from './WeeklyConnectRow'
import type { MasaiverseV2WeeklyConnect } from '@/server/api/masaiverse-v2/services/getClubWeeklyConnects.service'
import { masaiverseV2ClubEventsQuery } from '@/query/masaiverse-v2/clubsQuery'
import { getEventStatus } from '@/lib/masaiverseEventCard'

type WeeklyConnectsSectionProps = {
  clubId: string
  /** Opens the calendar/schedule drawer. */
  onViewSchedule?: () => void
  /** Injectable clock for deterministic rendering/tests. */
  now?: Date
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
  now = new Date(),
}: WeeklyConnectsSectionProps) {
  const { data, isPending } = useQuery(masaiverseV2ClubEventsQuery(clubId))
  const connects = sortConnects(data?.weeklyConnects ?? [], now)

  return (
    <section>
      <SectionHeader
        title="Weekly Connects"
        action={
          <button
            type="button"
            onClick={onViewSchedule}
            className="text-[14px] font-medium text-masaiverse-orange hover:underline"
          >
            See schedule →
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
              className="h-[84px] animate-pulse rounded-[16px] bg-[#EDEAE8]"
            />
          ))}
        </div>
      ) : connects.length === 0 ? (
        <p className="text-[14px] text-[#6B7280]">
          No weekly connects scheduled yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {connects.map((connect) => (
            <WeeklyConnectRow key={connect.id} connect={connect} now={now} />
          ))}
        </div>
      )}
    </section>
  )
}
