import type { BookmarkTab } from './bookmarksConfig'
import { isIsoDate } from '@/lib/isIsoDate'

export { isIsoDate }

export interface FilterOption {
  value: string
  label: string
}

/** Selected filter state for the bookmarks drawer (URL-driven). */
export interface BookmarkFilters {
  categories: Array<string>
  modules: Array<string>
  types: Array<string>
  statuses: Array<string>
  priorities: Array<string>
  startDate?: string
  endDate?: string
}

export function createEmptyBookmarkFilters(): BookmarkFilters {
  return {
    categories: [],
    modules: [],
    types: [],
    statuses: [],
    priorities: [],
  }
}

export type BookmarkFilterSection =
  | 'category'
  | 'module'
  | 'type'
  | 'status'
  | 'priority'
  | 'date'

export const SECTION_LABELS: Record<BookmarkFilterSection, string> = {
  category: 'Category',
  module: 'Module',
  type: 'Type',
  status: 'Status',
  priority: 'Priority',
  date: 'Saved date',
}

/** Which filter sections each tab exposes (order = nav order). */
const TAB_SECTIONS: Record<BookmarkTab, Array<BookmarkFilterSection>> = {
  lectures: ['category', 'module', 'type', 'date'],
  assignments: ['category', 'module', 'date'],
  tickets: ['status', 'priority', 'category', 'date'],
  announcements: ['category', 'type', 'date'],
  masaiverse: ['date'],
}

export function getBookmarkFilterSections(
  tab: BookmarkTab,
): Array<BookmarkFilterSection> {
  return TAB_SECTIONS[tab]
}

/** Fixed "Type" options — only Lectures and Announcements expose a Type filter. */
export const LECTURE_TYPE_OPTIONS: Array<FilterOption> = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'resource', label: 'Resource' },
]

export const ANNOUNCEMENT_TYPE_OPTIONS: Array<FilterOption> = [
  { value: 'critical', label: 'Critical' },
  { value: 'info', label: 'Information' },
]

export function getTypeOptions(tab: BookmarkTab): Array<FilterOption> {
  if (tab === 'lectures') return LECTURE_TYPE_OPTIONS
  if (tab === 'announcements') return ANNOUNCEMENT_TYPE_OPTIONS
  return []
}

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
