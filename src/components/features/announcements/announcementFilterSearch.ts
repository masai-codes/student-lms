import { isIsoDate, normalizeFilterValues } from './announcementFilterConfig'
import type { AnnouncementFilters } from './announcementFilterConfig'

/** URL search-param slice owned by the announcements filter drawer. */
export interface AnnouncementFiltersSearch {
  type?: Array<string>
  category?: Array<string>
  announcedBy?: Array<string>
  startDate?: string
  endDate?: string
}

const TYPE_LABELS: Record<string, string> = {
  critical: 'Critical',
  info: 'Information',
}

export function filtersFromSearch(
  search: AnnouncementFiltersSearch,
): AnnouncementFilters {
  const cleanDate = (value?: string) =>
    value && isIsoDate(value) ? value : undefined
  return {
    types: normalizeFilterValues(search.type),
    categories: normalizeFilterValues(search.category),
    announcedBy: normalizeFilterValues(search.announcedBy),
    startDate: cleanDate(search.startDate),
    endDate: cleanDate(search.endDate),
  }
}

const orUndefined = (values: Array<string>) =>
  values.length > 0 ? values : undefined

export function searchFromFilters(
  filters: AnnouncementFilters,
): AnnouncementFiltersSearch {
  return {
    type: orUndefined(filters.types),
    category: orUndefined(filters.categories),
    announcedBy: orUndefined(filters.announcedBy),
    startDate: filters.startDate,
    endDate: filters.endDate,
  }
}

export function countActiveAnnouncementFilters(
  filters: AnnouncementFilters,
): number {
  return (
    filters.types.length +
    filters.categories.length +
    filters.announcedBy.length +
    (filters.startDate || filters.endDate ? 1 : 0)
  )
}

export function hasActiveAnnouncementFilters(
  filters: AnnouncementFilters,
): boolean {
  return countActiveAnnouncementFilters(filters) > 0
}

export interface AppliedAnnouncementChip {
  key: string
  label: string
  next: AnnouncementFilters
}

function dateChipLabel(start?: string, end?: string): string {
  if (start && end) return start === end ? start : `${start} → ${end}`
  return `On or ${start ? `after ${start}` : `before ${end}`}`
}

/**
 * One removable chip per selected value; `next` is the filter state minus it.
 * `announcerNames` maps author id → display name for the "Announced by" chips.
 */
export function buildAppliedAnnouncementChips(
  filters: AnnouncementFilters,
  announcerNames: Record<string, string> = {},
): Array<AppliedAnnouncementChip> {
  const chips: Array<AppliedAnnouncementChip> = []

  const pushArray = (
    field: 'types' | 'categories' | 'announcedBy',
    labelFor: (v: string) => string,
  ) => {
    for (const value of filters[field]) {
      chips.push({
        key: `${field}:${value}`,
        label: labelFor(value),
        next: { ...filters, [field]: filters[field].filter((v) => v !== value) },
      })
    }
  }

  pushArray('types', (v) => TYPE_LABELS[v] ?? v)
  pushArray('categories', (v) => v)
  pushArray('announcedBy', (v) => announcerNames[v] ?? v)

  if (filters.startDate || filters.endDate) {
    chips.push({
      key: 'date',
      label: dateChipLabel(filters.startDate, filters.endDate),
      next: { ...filters, startDate: undefined, endDate: undefined },
    })
  }

  return chips
}
