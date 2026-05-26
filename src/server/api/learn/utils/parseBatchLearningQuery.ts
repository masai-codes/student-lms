import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type {
  BatchLearningFiltersInput,
  GetBatchLearningDataInput,
  LearnAttendanceStatusFilter,
  LearnSchedulePhaseFilter,
  LearningPriority,
  LearningType,
} from '@/server/learn/types'
import { ApiError } from '@/server/api/http/apiError'

const LEARNING_TYPES = new Set<LearningType>(['lecture', 'assignment', 'resource'])
const PRIORITIES = new Set<LearningPriority>(['recommended', 'mandatory'])
const SCHEDULE_PHASES = new Set<LearnSchedulePhaseFilter>(['all', 'upcoming', 'past'])
const ATTENDANCE_STATUSES = new Set<LearnAttendanceStatusFilter>(['present', 'absent'])
const ASSIGNMENT_PROGRESS = new Set<AssignmentProgressStatus>([
  'new',
  'in-progress',
  'completed',
  'overdue',
])

function parsePositiveInt(value: string | null): number | undefined {
  if (value == null || value.trim() === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return Math.trunc(parsed)
}

function parseStringList(value: string | null): Array<string> | undefined {
  if (value == null || value.trim() === '') return undefined
  const items = value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : undefined
}

function parsePriorityList(value: string | null): Array<LearningPriority> | undefined {
  const items = parseStringList(value)
  if (!items) return undefined
  const priorities = items.filter((item): item is LearningPriority =>
    PRIORITIES.has(item as LearningPriority),
  )
  return priorities.length > 0 ? priorities : undefined
}

function parseSchedulePhase(value: string | null): LearnSchedulePhaseFilter | undefined {
  if (value == null || value.trim() === '' || value === 'all') return undefined
  return SCHEDULE_PHASES.has(value as LearnSchedulePhaseFilter)
    ? (value as LearnSchedulePhaseFilter)
    : undefined
}

function parseAttendanceStatus(
  value: string | null,
): LearnAttendanceStatusFilter | undefined {
  if (value == null || value.trim() === '') return undefined
  return ATTENDANCE_STATUSES.has(value as LearnAttendanceStatusFilter)
    ? (value as LearnAttendanceStatusFilter)
    : undefined
}

function parseAssignmentProgressList(
  value: string | null,
): Array<AssignmentProgressStatus> | undefined {
  if (value == null || value.trim() === '' || value === 'all') return undefined
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is AssignmentProgressStatus =>
      ASSIGNMENT_PROGRESS.has(item as AssignmentProgressStatus),
    )
  return items.length > 0 ? items : undefined
}

function parseOptionalPriorities(value: string | null): Array<LearningPriority> | undefined {
  if (value === 'yes' || value === 'true') return ['recommended']
  if (value === 'no' || value === 'false') return ['mandatory']
  return undefined
}

function parseFiltersJson(value: string | null): BatchLearningFiltersInput | undefined {
  if (value == null || value.trim() === '') return undefined
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return undefined
    return parsed as BatchLearningFiltersInput
  } catch {
    throw new ApiError(400, 'INVALID_FILTERS_JSON')
  }
}

export function parseBatchLearningQuery(url: URL): GetBatchLearningDataInput {
  const batchId = parsePositiveInt(url.searchParams.get('batchId'))
  const learningTypeRaw = url.searchParams.get('learningType')

  if (batchId == null) {
    throw new ApiError(400, 'MISSING_BATCH_ID')
  }

  if (learningTypeRaw == null || !LEARNING_TYPES.has(learningTypeRaw as LearningType)) {
    throw new ApiError(400, 'INVALID_LEARNING_TYPE')
  }

  const filtersFromJson = parseFiltersJson(url.searchParams.get('filters'))

  const lectureTab = url.searchParams.get('lectureTab')
  const assignmentTab = url.searchParams.get('assignmentTab')

  const filters: BatchLearningFiltersInput = {
    modules:
      parseStringList(url.searchParams.get('modules')) ??
      parseStringList(url.searchParams.get('module')) ??
      filtersFromJson?.modules,
    categories:
      parseStringList(url.searchParams.get('categories')) ??
      parseStringList(url.searchParams.get('category')) ??
      filtersFromJson?.categories,
    types:
      parseStringList(url.searchParams.get('types')) ??
      parseStringList(url.searchParams.get('type')) ??
      filtersFromJson?.types,
    priorities:
      parsePriorityList(url.searchParams.get('priorities')) ??
      parseOptionalPriorities(url.searchParams.get('optional')) ??
      filtersFromJson?.priorities,
    instructors:
      parseStringList(url.searchParams.get('instructors')) ??
      parseStringList(url.searchParams.get('instructor')) ??
      filtersFromJson?.instructors,
    scheduleStartDate:
      url.searchParams.get('scheduleStartDate')?.trim() ||
      url.searchParams.get('startDate')?.trim() ||
      filtersFromJson?.scheduleStartDate,
    scheduleEndDate:
      url.searchParams.get('scheduleEndDate')?.trim() ||
      url.searchParams.get('endDate')?.trim() ||
      filtersFromJson?.scheduleEndDate,
    schedulePhase:
      parseSchedulePhase(url.searchParams.get('schedulePhase')) ??
      parseSchedulePhase(lectureTab) ??
      filtersFromJson?.schedulePhase,
    attendanceStatus:
      parseAttendanceStatus(url.searchParams.get('attendanceStatus')) ??
      filtersFromJson?.attendanceStatus,
    assignmentProgressStatuses:
      parseAssignmentProgressList(url.searchParams.get('assignmentProgress')) ??
      parseAssignmentProgressList(assignmentTab) ??
      filtersFromJson?.assignmentProgressStatuses,
  }

  const hasFilters = Object.values(filters).some(
    value => value != null && (!(Array.isArray(value)) || value.length > 0),
  )

  return {
    batchId,
    learningType: learningTypeRaw as LearningType,
    search: url.searchParams.get('search')?.trim() || undefined,
    page: parsePositiveInt(url.searchParams.get('page')),
    pageSize: parsePositiveInt(url.searchParams.get('pageSize')),
    filters: hasFilters ? filters : undefined,
  }
}
