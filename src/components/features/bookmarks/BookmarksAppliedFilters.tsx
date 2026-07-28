import { X } from 'lucide-react'
import { MasaiChips } from '@/components/ui/masai-chips'
import { buildAppliedBookmarkChips } from './bookmarksFilterSearch'
import type { BookmarkFilters } from './bookmarksFilterConfig'

export interface BookmarksAppliedFiltersProps {
  filters: BookmarkFilters
  /** Called with the next filter state when a single chip is removed. */
  onChange: (next: BookmarkFilters) => void
  onClearAll: () => void
}

/** Removable chips for each active bookmark filter. Renders nothing when empty. */
export function BookmarksAppliedFilters({
  filters,
  onChange,
  onClearAll,
}: BookmarksAppliedFiltersProps) {
  const chips = buildAppliedBookmarkChips(filters)
  if (chips.length === 0) return null

  return (
    <div
      data-testid="bookmarks-applied-filters"
      className="flex flex-wrap items-center gap-2"
    >
      {chips.map((chip) => (
        <MasaiChips
          key={chip.key}
          type="right-icon"
          label={chip.label}
          icon={<X size={14} />}
          data-testid={`bookmarks-chip-${chip.key}`}
          onClick={() => onChange(chip.next)}
        />
      ))}
      <button
        type="button"
        data-testid="bookmarks-clear-all"
        onClick={onClearAll}
        className="type-b3-md text-brand transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
      >
        Clear all
      </button>
    </div>
  )
}
