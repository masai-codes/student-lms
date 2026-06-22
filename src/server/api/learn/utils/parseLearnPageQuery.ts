import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type {
  BatchLearningFiltersInput,
  GetLearnPageDataInput,
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
    .map((item) => item.trim())
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

function parseAttendanceStatus(value: string | null): LearnAttendanceStatusFilter | undefined {
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

function buildFilters(url: URL): BatchLearningFiltersInput {
  const params = url.searchParams
  const lectureTab = params.get('lectureTab')
  const assignmentTab = params.get('assignmentTab')

  return {
    modules: parseStringList(params.get('modules')) ?? parseStringList(params.get('module')),
    categories:
      parseStringList(params.get('categories')) ?? parseStringList(params.get('category')),
    types: parseStringList(params.get('types')) ?? parseStringList(params.get('type')),
    priorities:
      parsePriorityList(params.get('priorities')) ??
      parseOptionalPriorities(params.get('optional')),
    instructors:
      parseStringList(params.get('instructors')) ?? parseStringList(params.get('instructor')),
    scheduleStartDate:
      params.get('scheduleStartDate')?.trim() || params.get('startDate')?.trim() || undefined,
    scheduleEndDate:
      params.get('scheduleEndDate')?.trim() || params.get('endDate')?.trim() || undefined,
    schedulePhase:
      parseSchedulePhase(params.get('schedulePhase')) ?? parseSchedulePhase(lectureTab),
    attendanceStatus: parseAttendanceStatus(params.get('attendanceStatus')),
    assignmentProgressStatuses:
      parseAssignmentProgressList(params.get('assignmentProgress')) ??
      parseAssignmentProgressList(assignmentTab),
  }
}

/** Parses `/api/learn/page` query params. `batchId` is optional; `learningType` is required. */
export function parseLearnPageQuery(url: URL): GetLearnPageDataInput {
  const learningTypeRaw = url.searchParams.get('learningType')
  if (learningTypeRaw == null || !LEARNING_TYPES.has(learningTypeRaw as LearningType)) {
    throw new ApiError(400, 'INVALID_LEARNING_TYPE')
  }

  const filters = buildFilters(url)
  const hasFilters = Object.values(filters).some(
    (value) => value != null && (!Array.isArray(value) || value.length > 0),
  )

  return {
    batchId: parsePositiveInt(url.searchParams.get('batchId')),
    learningType: learningTypeRaw as LearningType,
    search: url.searchParams.get('search')?.trim() || undefined,
    page: parsePositiveInt(url.searchParams.get('page')),
    pageSize: parsePositiveInt(url.searchParams.get('pageSize')),
    filters: hasFilters ? filters : undefined,
  }
}
