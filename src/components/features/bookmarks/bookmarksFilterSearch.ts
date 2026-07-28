import {
  isIsoDate,
  normalizeFilterValues,
} from './bookmarksFilterConfig'
import type { BookmarkFilters } from './bookmarksFilterConfig'

/** URL search-param slice owned by the bookmarks filter drawer. */
export interface BookmarkFiltersSearch {
  category?: Array<string>
  module?: Array<string>
  type?: Array<string>
  status?: Array<string>
  priority?: Array<string>
  startDate?: string
  endDate?: string
}

const TYPE_LABELS: Record<string, string> = {
  lecture: 'Lecture',
  resource: 'Resource',
  critical: 'Critical',
  info: 'Information',
}

type ArrayField = 'categories' | 'modules' | 'types' | 'statuses' | 'priorities'

export function filtersFromSearch(
  search: BookmarkFiltersSearch,
): BookmarkFilters {
  const cleanDate = (value?: string) =>
    value && isIsoDate(value) ? value : undefined
  return {
    categories: normalizeFilterValues(search.category),
    modules: normalizeFilterValues(search.module),
    types: normalizeFilterValues(search.type),
    statuses: normalizeFilterValues(search.status),
    priorities: normalizeFilterValues(search.priority),
    startDate: cleanDate(search.startDate),
    endDate: cleanDate(search.endDate),
  }
}

const orUndefined = (values: Array<string>) =>
  values.length > 0 ? values : undefined

export function searchFromFilters(
  filters: BookmarkFilters,
): BookmarkFiltersSearch {
  return {
    category: orUndefined(filters.categories),
    module: orUndefined(filters.modules),
    type: orUndefined(filters.types),
    status: orUndefined(filters.statuses),
    priority: orUndefined(filters.priorities),
    startDate: filters.startDate,
    endDate: filters.endDate,
  }
}

export function countActiveBookmarkFilters(filters: BookmarkFilters): number {
  return (
    filters.categories.length +
    filters.modules.length +
    filters.types.length +
    filters.statuses.length +
    filters.priorities.length +
    (filters.startDate || filters.endDate ? 1 : 0)
  )
}

export function hasActiveBookmarkFilters(filters: BookmarkFilters): boolean {
  return countActiveBookmarkFilters(filters) > 0
}

export interface AppliedBookmarkChip {
  key: string
  label: string
  next: BookmarkFilters
}

function dateChipLabel(start?: string, end?: string): string {
  if (start && end) return start === end ? start : `${start} → ${end}`
  return `On or ${start ? `after ${start}` : `before ${end}`}`
}

/** One removable chip per selected value; `next` is the filter state minus it. */
export function buildAppliedBookmarkChips(
  filters: BookmarkFilters,
): Array<AppliedBookmarkChip> {
  const chips: Array<AppliedBookmarkChip> = []

  const pushArray = (field: ArrayField, labelFor: (v: string) => string) => {
    for (const value of filters[field]) {
      chips.push({
        key: `${field}:${value}`,
        label: labelFor(value),
        next: {
          ...filters,
          [field]: filters[field].filter((v) => v !== value),
        },
      })
    }
  }

  const identity = (v: string) => v
  pushArray('categories', identity)
  pushArray('modules', identity)
  pushArray('statuses', identity)
  pushArray('priorities', identity)
  pushArray('types', (v) => TYPE_LABELS[v] ?? v)

  if (filters.startDate || filters.endDate) {
    chips.push({
      key: 'date',
      label: dateChipLabel(filters.startDate, filters.endDate),
      next: { ...filters, startDate: undefined, endDate: undefined },
    })
  }

  return chips
}
