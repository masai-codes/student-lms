import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { MasaiChips } from '@/components/ui/masai-chips'
import { fetchAnnouncementFilterOptions } from '@/lib/api/announcement/announcementApi'
import { buildAppliedAnnouncementChips } from './announcementFilterSearch'
import { ANNOUNCEMENT_FILTER_OPTIONS_KEY } from './AnnouncementFilterDrawer'
import type { AnnouncementFilters } from './announcementFilterConfig'

export interface AnnouncementAppliedFiltersProps {
  filters: AnnouncementFilters
  onChange: (next: AnnouncementFilters) => void
  onClearAll: () => void
}

/** Removable chips for each active announcement filter. Renders nothing when empty. */
export function AnnouncementAppliedFilters({
  filters,
  onChange,
  onClearAll,
}: AnnouncementAppliedFiltersProps) {
  // Shares the drawer's cached options query — used to label "Announced by" chips.
  const { data } = useQuery({
    queryKey: ANNOUNCEMENT_FILTER_OPTIONS_KEY,
    queryFn: fetchAnnouncementFilterOptions,
    staleTime: 30 * 60 * 1000,
  })

  const announcerNames = Object.fromEntries(
    (data?.announcers ?? []).map((a) => [a.id, a.name]),
  )
  const chips = buildAppliedAnnouncementChips(filters, announcerNames)
  if (chips.length === 0) return null

  return (
    <div
      data-testid="announcements-applied-filters"
      className="flex flex-wrap items-center gap-2"
    >
      {chips.map((chip) => (
        <MasaiChips
          key={chip.key}
          type="right-icon"
          label={chip.label}
          icon={<X size={14} />}
          data-testid={`announcements-chip-${chip.key}`}
          onClick={() => onChange(chip.next)}
        />
      ))}
      <button
        type="button"
        data-testid="announcements-clear-all"
        onClick={onClearAll}
        className="type-b3-md text-brand transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
      >
        Clear all
      </button>
    </div>
  )
}
