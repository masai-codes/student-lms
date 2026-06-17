import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarX } from '@phosphor-icons/react'
import AdminCreateButton from '../AdminCreateButton'
import EventListCard from './events/EventListCard'
import EventsToolbar from './events/EventsToolbar'
import {
  getEventBucket,
  matchesScope,
  matchesSearch,
  sortForBucket,
} from './events/eventBuckets'
import type {
  EventScopeFilter,
  EventTimeBucket,
} from './events/eventBuckets'
import { masaiverseV2EventsQuery } from '@/query/masaiverse-v2/eventsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

/**
 * Community events page. One GET feeds every card; the client segregates them
 * along two axes — time (upcoming/past tabs) and host (community vs club
 * chips) — and orders upcoming soonest-first, past most-recent-first.
 */
export default function EventsPage({ now: nowProp }: { now?: Date }) {
  const { data, isPending } = useQuery(masaiverseV2EventsQuery())
  const events = data ?? []
  // One clock per render keeps the bucketing of every card consistent;
  // `now` is injectable so tests can pin the upcoming/past split.
  const now = useMemo(() => nowProp ?? new Date(), [nowProp])

  const [tab, setTab] = useState<EventTimeBucket>('upcoming')
  const [scope, setScope] = useState<EventScopeFilter>('all')
  const [search, setSearch] = useState('')

  // Track the committed (debounced) search query, not every keystroke.
  useEffect(() => {
    const trimmed = search.trim()
    if (!trimmed) return
    const id = setTimeout(() => {
      trackMasaiverse(MASAIVERSE_EVENTS.eventsSearch, { query: trimmed })
    }, 400)
    return () => clearTimeout(id)
  }, [search])

  const view = useMemo(() => {
    const searched = events.filter((event) => matchesSearch(event, search))
    const inActiveBucket = searched.filter(
      (event) => getEventBucket(event, now) === tab,
    )
    const scoped = searched.filter((event) => matchesScope(event, scope))

    return {
      tabCounts: {
        upcoming: scoped.filter((e) => getEventBucket(e, now) === 'upcoming')
          .length,
        past: scoped.filter((e) => getEventBucket(e, now) === 'past').length,
      } satisfies Record<EventTimeBucket, number>,
      scopeCounts: {
        all: inActiveBucket.length,
        public: inActiveBucket.filter((e) => e.clubId == null).length,
        clubs: inActiveBucket.filter((e) => e.clubId != null).length,
      } satisfies Record<EventScopeFilter, number>,
      visible: sortForBucket(
        inActiveBucket.filter((e) => matchesScope(e, scope)),
        tab,
      ),
    }
  }, [events, now, scope, search, tab])

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold leading-7 text-[#111827]">
            Events
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
            Hackathons, meetups, and webinars across the community and your
            clubs.
          </p>
        </div>
        <AdminCreateButton kind="event" />
      </div>

      <EventsToolbar
        search={search}
        onSearchChange={setSearch}
        tab={tab}
        onTabChange={(next) => {
          trackMasaiverse(MASAIVERSE_EVENTS.eventsTabChange, { tab: next })
          setTab(next)
        }}
        tabCounts={view.tabCounts}
        scope={scope}
        onScopeChange={(next) => {
          trackMasaiverse(MASAIVERSE_EVENTS.eventsScopeChange, { scope: next })
          setScope(next)
        }}
        scopeCounts={view.scopeCounts}
      />

      {isPending ? (
        <div
          role="status"
          aria-label="Loading events"
          className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4"
        >
          <span className="sr-only">Loading events…</span>
          {[0, 1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-[240px] animate-pulse rounded-[14px] bg-[#ECE7E2]"
            />
          ))}
        </div>
      ) : view.visible.length === 0 ? (
        <EmptyState bucket={tab} />
      ) : (
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
          {view.visible.map((event) => (
            <EventListCard
              key={event.id}
              event={event}
              now={now}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ bucket }: { bucket: EventTimeBucket }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-[14px] border border-dashed border-[#E0D9D3] bg-[#FBF9F8] px-6 py-14 text-center">
      <CalendarX size={32} weight="duotone" className="text-[#B8AEA6]" />
      <p className="mt-3 text-[15px] font-semibold text-[#111827]">
        {bucket === 'upcoming' ? 'No upcoming events' : 'No past events'}
      </p>
      <p className="mt-1 text-[13px] text-[#6B7280]">
        {bucket === 'upcoming'
          ? 'Check back soon — new events are added regularly.'
          : 'Past events will show up here once they wrap.'}
      </p>
    </div>
  )
}
