import type {
  BatchLearningFiltersInput,
  GetBatchLearningDataInput,
  LearningPriority,
  LearningType,
} from '@/server/learn/types'
import { ApiError } from '@/server/api/http/apiError'

const LEARNING_TYPES = new Set<LearningType>(['lecture', 'assignment', 'resource'])
const PRIORITIES = new Set<LearningPriority>(['recommended', 'mandatory'])

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

  const filters: BatchLearningFiltersInput = {
    modules: parseStringList(url.searchParams.get('modules')) ?? filtersFromJson?.modules,
    categories:
      parseStringList(url.searchParams.get('categories')) ?? filtersFromJson?.categories,
    types: parseStringList(url.searchParams.get('types')) ?? filtersFromJson?.types,
    priorities:
      parsePriorityList(url.searchParams.get('priorities')) ?? filtersFromJson?.priorities,
    instructors:
      parseStringList(url.searchParams.get('instructors')) ?? filtersFromJson?.instructors,
    scheduleStartDate:
      url.searchParams.get('scheduleStartDate')?.trim() ||
      filtersFromJson?.scheduleStartDate,
    scheduleEndDate:
      url.searchParams.get('scheduleEndDate')?.trim() || filtersFromJson?.scheduleEndDate,
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
