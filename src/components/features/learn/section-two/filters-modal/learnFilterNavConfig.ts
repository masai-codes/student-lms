import type { LearnTab } from '../../shared/types'

export type FilterNavKey =
  | 'module'
  | 'category'
  | 'type'
  | 'progress'
  | 'attendance'
  | 'date'
  | 'priority'
  | 'instructor'

type NavItem = { key: FilterNavKey; label: string }

const ALL_NAV_ITEMS: Array<NavItem> = [
  { key: 'module', label: 'Module' },
  { key: 'category', label: 'Category' },
  { key: 'type', label: 'Type' },
  { key: 'progress', label: 'Progress Status' },
  { key: 'attendance', label: 'Attendance Status' },
  { key: 'date', label: 'Date' },
  { key: 'priority', label: 'Priority' },
  { key: 'instructor', label: 'Instructor' },
]

const RESOURCES_HIDDEN: ReadonlySet<FilterNavKey> = new Set([
  'type',
  'progress',
  'attendance',
])

export function getLearnFilterNavItems(tab: LearnTab): Array<NavItem> {
  if (tab === 'resources') {
    return ALL_NAV_ITEMS.filter((item) => !RESOURCES_HIDDEN.has(item.key))
  }
  if (tab === 'assignments') {
    return ALL_NAV_ITEMS.filter((item) => item.key !== 'attendance')
  }
  return ALL_NAV_ITEMS
}

export function getDefaultLearnFilterNav(tab: LearnTab): FilterNavKey {
  return getLearnFilterNavItems(tab)[0]?.key ?? 'module'
}
