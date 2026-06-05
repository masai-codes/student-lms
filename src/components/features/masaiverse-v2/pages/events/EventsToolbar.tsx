import { MagnifyingGlass } from '@phosphor-icons/react'
import type { EventScopeFilter, EventTimeBucket } from './eventBuckets'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type EventsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  tab: EventTimeBucket
  onTabChange: (tab: EventTimeBucket) => void
  tabCounts: Record<EventTimeBucket, number>
  scope: EventScopeFilter
  onScopeChange: (scope: EventScopeFilter) => void
  scopeCounts: Record<EventScopeFilter, number>
}

const SCOPES: Array<{ value: EventScopeFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Community' },
  { value: 'clubs', label: 'Clubs' },
]

/** Time tabs (upcoming/past), host-scope chips, and a title/club/venue search. */
export default function EventsToolbar({
  search,
  onSearchChange,
  tab,
  onTabChange,
  tabCounts,
  scope,
  onScopeChange,
  scopeCounts,
}: EventsToolbarProps) {
  return (
    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={tab} onValueChange={(value) => onTabChange(value as EventTimeBucket)}>
        <TabsList className="bg-[#F1ECE8]">
          <TabsTrigger value="upcoming" className="px-3">
            Upcoming
            <CountPill active={tab === 'upcoming'} value={tabCounts.upcoming} />
          </TabsTrigger>
          <TabsTrigger value="past" className="px-3">
            Past
            <CountPill active={tab === 'past'} value={tabCounts.past} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-[#F1ECE8] p-1">
          {SCOPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={scope === value}
              onClick={() => onScopeChange(value)}
              className={cn(
                'rounded-full px-3 py-1 text-[13px] font-medium transition-colors',
                scope === value
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111827]',
              )}
            >
              {label}
              <span className="ml-1 text-[11px] text-[#9CA3AF]">
                {scopeCounts[value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search events"
            aria-label="Search events"
            className="h-9 w-full pl-9 sm:w-56"
          />
        </div>
      </div>
    </div>
  )
}

function CountPill({ active, value }: { active: boolean; value: number }) {
  return (
    <span
      className={cn(
        'ml-1.5 rounded-full px-1.5 text-[11px] font-semibold leading-5',
        active ? 'bg-masaiverse-orange/15 text-masaiverse-orange' : 'text-[#9CA3AF]',
      )}
    >
      {value}
    </span>
  )
}
