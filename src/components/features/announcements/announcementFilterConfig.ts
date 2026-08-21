import { isIsoDate } from '@/lib/isIsoDate'
import type { FilterColumnOption } from '@/components/features/shared/FilterCheckboxColumn'

export { isIsoDate }

/** Selected filter state for the announcements drawer (URL-driven). */
export interface AnnouncementFilters {
  types: Array<string>
  categories: Array<string>
  announcedBy: Array<string>
  startDate?: string
  endDate?: string
}

export function createEmptyAnnouncementFilters(): AnnouncementFilters {
  return { types: [], categories: [], announcedBy: [] }
}

export type AnnouncementFilterSection =
  | 'type'
  | 'category'
  | 'announcedBy'
  | 'date'

export const ANNOUNCEMENT_FILTER_SECTIONS: Array<AnnouncementFilterSection> = [
  'type',
  'category',
  'announcedBy',
  'date',
]

export const SECTION_LABELS: Record<AnnouncementFilterSection, string> = {
  type: 'Type',
  category: 'Category',
  announcedBy: 'Announced by',
  date: 'Announced date',
}

/**
 * Fixed announcement TYPE options. Matches the old LMS student filter, which
 * surfaces only `critical` and `info`.
 */
export const ANNOUNCEMENT_TYPE_OPTIONS: Array<FilterColumnOption> = [
  { value: 'critical', label: 'Critical' },
  { value: 'info', label: 'Information' },
]

/** Coerce a raw search-param value into a deduped list of non-empty strings. */
export function normalizeFilterValues(raw: unknown): Array<string> {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'string' && raw.length > 0
      ? raw.split(',')
      : []
  return [
    ...new Set(
      list
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ]
}
