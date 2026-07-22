import { useState } from 'react'
import { MasaiCheckbox } from '@/components/ui/masai-checkbox'
import { MasaiInput } from '@/components/ui/masai-input'
import type { FilterOption } from './bookmarksFilterConfig'

export interface BookmarkCheckboxColumnProps {
  options: Array<FilterOption>
  selected: Array<string>
  onToggle: (value: string) => void
  /** Show the in-list search box once the list is long enough to warrant it. */
  searchable?: boolean
}

/**
 * A searchable multi-select checkbox list used inside the bookmarks filter
 * drawer. Self-contained: owns its own list-search text.
 */
export function BookmarkCheckboxColumn({
  options,
  selected,
  onToggle,
  searchable = true,
}: BookmarkCheckboxColumnProps) {
  const [search, setSearch] = useState('')

  if (options.length === 0) {
    return (
      <p
        data-testid="bookmarks-filter-empty-options"
        className="type-b2-regular text-foreground-subtle"
      >
        No options available.
      </p>
    )
  }

  const query = search.trim().toLowerCase()
  const visible = query
    ? options.filter((o) => o.label.toLowerCase().includes(query))
    : options

  return (
    <div className="flex flex-col gap-3">
      {searchable && options.length > 6 ? (
        <MasaiInput
          type="search"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      ) : null}
      <div className="flex flex-col gap-3">
        {visible.length > 0 ? (
          visible.map((option) => (
            <MasaiCheckbox
              key={option.value}
              label={option.label}
              isSelected={selected.includes(option.value)}
              onSelect={() => onToggle(option.value)}
            />
          ))
        ) : (
          <p className="type-b2-regular text-foreground-subtle">No matches.</p>
        )}
      </div>
    </div>
  )
}
