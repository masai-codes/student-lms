import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { MasaiDropdownCheckboxFilter } from '@/components/ui/masai-dropdown-checkbox-filter'
import { fetchAnnouncementFilterOptions } from '@/lib/api/announcement/announcementApi'
import { pushGtmEvent } from '@/utils/gtm'
import { ANNOUNCEMENT_TYPE_OPTIONS } from './announcementFilterConfig'

const FILTER_OPTIONS_STALE_MS = 30 * 60 * 1000 // 30 minutes

export interface AnnouncementFiltersValue {
  types: Array<string>
  categories: Array<string>
}

export interface AnnouncementFiltersProps {
  value: AnnouncementFiltersValue
  onChange: (next: AnnouncementFiltersValue) => void
}

/**
 * Type + Category multi-select filters for the announcements listing.
 *
 * Type options are fixed (`critical`/`info`, matching the old LMS student
 * filter); Category options are loaded from the `menus` table via the
 * filter-options endpoint. The Category dropdown is hidden when no configured
 * categories exist. Selection is controlled by the parent (URL search params).
 */
export function AnnouncementFilters({
  value,
  onChange,
}: AnnouncementFiltersProps) {
  const { data } = useQuery({
    queryKey: ['announcement-filter-options'],
    queryFn: fetchAnnouncementFilterOptions,
    staleTime: FILTER_OPTIONS_STALE_MS,
  })

  const categoryOptions = (data?.categories ?? []).map((category) => ({
    value: category,
    label: category,
  }))
  const activeCount = value.types.length + value.categories.length

  function handleTypes(types: Array<string>) {
    pushGtmEvent('l_announcement_filter_type_change', {
      count: types.length,
      values: types.join(','),
    })
    onChange({ ...value, types })
  }

  function handleCategories(categories: Array<string>) {
    pushGtmEvent('l_announcement_filter_category_change', {
      count: categories.length,
      values: categories.join(','),
    })
    onChange({ ...value, categories })
  }

  function handleClear() {
    pushGtmEvent('l_announcement_filter_clear', { count: activeCount })
    onChange({ types: [], categories: [] })
  }

  return (
    <div
      data-testid="announcements-filters"
      className="flex flex-wrap items-center gap-2"
    >
      <span data-testid="announcements-filter-type">
        <MasaiDropdownCheckboxFilter
          triggerLabel="Type"
          options={ANNOUNCEMENT_TYPE_OPTIONS}
          value={value.types}
          onValueChange={handleTypes}
          triggerClassName="min-h-[42px] min-w-[120px]"
        />
      </span>

      {categoryOptions.length > 0 && (
        <span data-testid="announcements-filter-category">
          <MasaiDropdownCheckboxFilter
            triggerLabel="Category"
            options={categoryOptions}
            value={value.categories}
            onValueChange={handleCategories}
            triggerClassName="min-h-[42px] min-w-[140px]"
          />
        </span>
      )}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={handleClear}
          data-testid="announcements-filters-clear"
          className="inline-flex items-center gap-1 rounded-md px-3 py-2 type-b2-md text-brand transition-colors hover:bg-brand/10 hover:-translate-y-px active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="size-4" aria-hidden />
          Clear
        </button>
      )}
    </div>
  )
}
