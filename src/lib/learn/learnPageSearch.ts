import type { LearnModalFiltersState, LearnTab } from '@/components/features/learn/shared/types'
import { createEmptyLearnModalFilters } from '@/components/features/learn/shared/types'
import type { BatchLearningFiltersInput } from '@/server/learn/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'

export type LearnPageSearchParams = {
  batchId?: number
  tab?: LearnTab
  page?: number
  search?: string
}

const LEARN_TABS = new Set<LearnTab>(['lectures', 'assignments', 'resources'])
const ASSIGNMENT_PROGRESS = new Set<AssignmentProgressStatus>([
  'new',
  'in-progress',
  'completed',
  'overdue',
])

function splitCsv(value: unknown): Array<string> {
  if (typeof value !== 'string' || value.trim() === '') return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function parsePositiveInt(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return Math.trunc(parsed)
}

function parseTab(value: unknown): LearnTab | undefined {
  if (typeof value !== 'string' || !LEARN_TABS.has(value as LearnTab)) return undefined
  return value as LearnTab
}

function parseSchedulePhase(
  value: unknown,
): LearnModalFiltersState['schedulePhase'] {
  if (value === 'upcoming' || value === 'past') return value
  return 'all'
}

function parseAssignmentProgress(
  value: unknown,
): LearnModalFiltersState['assignmentProgress'] {
  if (typeof value === 'string' && ASSIGNMENT_PROGRESS.has(value as AssignmentProgressStatus)) {
    return value as AssignmentProgressStatus
  }
  return 'all'
}

function parseAttendance(
  value: unknown,
): LearnModalFiltersState['attendanceStatus'] {
  if (value === 'present' || value === 'absent') return value
  return null
}

function parsePrioritiesFromOptional(value: unknown): Array<'recommended' | 'mandatory'> {
  if (value === 'yes' || value === 'true') return ['recommended']
  if (value === 'no' || value === 'false') return ['mandatory']
  return []
}

export function parseLearnPageSearch(search: Record<string, unknown>): LearnPageSearchParams {
  const batchId = parsePositiveInt(search.batchId)
  const tab = parseTab(search.tab)
  const page = parsePositiveInt(search.page)
  const searchText =
    typeof search.search === 'string'
      ? search.search
      : typeof search.title === 'string'
        ? search.title
        : typeof search.titleContains === 'string'
          ? search.titleContains
          : undefined

  return {
    batchId,
    tab,
    page,
    search: searchText?.trim() || undefined,
  }
}

export function learnModalFiltersFromSearch(
  search: Record<string, unknown>,
  tab: LearnTab,
): LearnModalFiltersState {
  const modules = splitCsv(search.module ?? search.modules)
  const categories = splitCsv(search.category ?? search.categories)
  const types =
    tab === 'resources'
      ? []
      : splitCsv(search.type ?? search.types)
  const instructors = splitCsv(search.instructor ?? search.instructors)
  const prioritiesFromList = splitCsv(search.priorities).filter(
    (value): value is 'recommended' | 'mandatory' =>
      value === 'recommended' || value === 'mandatory',
  )
  const priorities =
    prioritiesFromList.length > 0
      ? prioritiesFromList
      : parsePrioritiesFromOptional(search.optional)

  const startDate =
    typeof search.startDate === 'string'
      ? search.startDate
      : typeof search.scheduleStartDate === 'string'
        ? search.scheduleStartDate
        : null
  const endDate =
    typeof search.endDate === 'string'
      ? search.endDate
      : typeof search.scheduleEndDate === 'string'
        ? search.scheduleEndDate
        : null

  return {
    modules,
    categories,
    types,
    priorities,
    instructors,
    scheduleStartDate: startDate?.trim() ? startDate : null,
    scheduleEndDate: endDate?.trim() ? endDate : null,
    schedulePhase:
      tab === 'assignments'
        ? 'all'
        : parseSchedulePhase(search.lectureTab ?? search.schedulePhase),
    attendanceStatus:
      tab === 'lectures' ? parseAttendance(search.attendanceStatus) : null,
    assignmentProgress:
      tab === 'assignments'
        ? parseAssignmentProgress(search.assignmentTab ?? search.assignmentProgress)
        : 'all',
  }
}

export function countActiveLearnFilters(
  tab: LearnTab,
  filters: LearnModalFiltersState,
): number {
  let count = 0
  count += filters.modules.length
  count += filters.categories.length
  if (tab !== 'resources') count += filters.types.length
  count += filters.instructors.length
  count += filters.priorities.length
  if (filters.scheduleStartDate || filters.scheduleEndDate) count += 1

  if (tab === 'lectures') {
    if (filters.schedulePhase !== 'all') count += 1
    if (filters.attendanceStatus != null) count += 1
  } else if (tab === 'assignments') {
    if (filters.assignmentProgress !== 'all') count += 1
  } else if (filters.attendanceStatus != null) {
    count += 1
  }

  return count
}

function joinCsv(values: Array<string>): string | undefined {
  return values.length > 0 ? values.join(',') : undefined
}

/** Filter params restored per tab — never includes batchId, tab, page, or search. */
const TAB_SNAPSHOT_FILTER_KEYS = [
  'module',
  'category',
  'type',
  'instructor',
  'startDate',
  'endDate',
  'optional',
  'priorities',
  'lectureTab',
  'assignmentTab',
  'attendanceStatus',
] as const

export function learnSearchFromModalFilters(
  tab: LearnTab,
  filters: LearnModalFiltersState,
  options: { page?: number; search?: string },
): Record<string, string | number | undefined> {
  const next: Record<string, string | number | undefined> = {
    tab,
    page: options.page ?? 1,
    search: options.search?.trim() || undefined,
    module: joinCsv(filters.modules),
    category: joinCsv(filters.categories),
    instructor: joinCsv(filters.instructors),
    startDate: filters.scheduleStartDate ?? undefined,
    endDate: filters.scheduleEndDate ?? undefined,
  }

  if (tab !== 'resources') {
    next.type = joinCsv(filters.types)
  }

  if (filters.priorities.length === 1) {
    next.optional = filters.priorities[0] === 'recommended' ? 'yes' : 'no'
  }

  if (tab === 'lectures' || tab === 'resources') {
    next.lectureTab = filters.schedulePhase === 'all' ? 'all' : filters.schedulePhase
    if (tab === 'lectures' && filters.attendanceStatus != null) {
      next.attendanceStatus = filters.attendanceStatus
    }
  }

  if (tab === 'assignments') {
    next.assignmentTab =
      filters.assignmentProgress === 'all' ? 'all' : filters.assignmentProgress
  }

  return next
}

const LEARN_FILTER_SEARCH_KEYS = [
  'module',
  'modules',
  'category',
  'categories',
  'type',
  'types',
  'instructor',
  'instructors',
  'startDate',
  'endDate',
  'scheduleStartDate',
  'scheduleEndDate',
  'optional',
  'priorities',
  'lectureTab',
  'schedulePhase',
  'attendanceStatus',
  'assignmentTab',
  'assignmentProgress',
] as const

export function stripLearnFilterSearchKeys(
  search: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...search }
  for (const key of LEARN_FILTER_SEARCH_KEYS) {
    delete next[key]
  }
  return next
}

/** Picks only tab-specific filter params (excludes batchId, tab, page, search). */
export function pickLearnTabSnapshotFilters(
  search: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const key of TAB_SNAPSHOT_FILTER_KEYS) {
    const value = search[key]
    if (value != null && value !== '') {
      next[key] = value
    }
  }
  return next
}

export function buildLearnNavigateSearch(
  tab: LearnTab,
  filters: LearnModalFiltersState,
  options: { page?: number; search?: string },
): Record<string, string | number | undefined> {
  const values = learnSearchFromModalFilters(tab, filters, options)
  const next: Record<string, string | number | undefined> = {}
  for (const [key, value] of Object.entries(values)) {
    if (value != null && value !== '') {
      next[key] = value
    }
  }
  return next
}

export function clearLearnFilterSearch(
  tab: LearnTab,
  options: { search?: string },
): Record<string, string | number | undefined> {
  return learnSearchFromModalFilters(tab, createEmptyLearnModalFilters(), {
    page: 1,
    search: options.search,
  })
}

export function modalFiltersToApiFilters(
  tab: LearnTab,
  filters: LearnModalFiltersState,
): BatchLearningFiltersInput {
  const api: BatchLearningFiltersInput = {
    modules: filters.modules.length > 0 ? filters.modules : undefined,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    types: filters.types.length > 0 ? filters.types : undefined,
    priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
    instructors: filters.instructors.length > 0 ? filters.instructors : undefined,
    scheduleStartDate: filters.scheduleStartDate ?? undefined,
    scheduleEndDate: filters.scheduleEndDate ?? undefined,
  }

  if (tab !== 'assignments' && filters.schedulePhase !== 'all') {
    api.schedulePhase = filters.schedulePhase
  }

  if (tab === 'lectures' && filters.attendanceStatus != null) {
    api.attendanceStatus = filters.attendanceStatus
  }

  if (tab === 'assignments' && filters.assignmentProgress !== 'all') {
    api.assignmentProgressStatuses = [filters.assignmentProgress]
  }

  return api
}
