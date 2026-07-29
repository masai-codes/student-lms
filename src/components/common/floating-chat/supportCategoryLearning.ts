import type {
  BatchLearningFiltersInput,
  LearningItem,
  LearningPriority,
  LearningType,
} from '@/server/learn/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import type { Item } from './types'

const LEARN_CATEGORY_IDS = new Set(['lecture', 'assignment', 'resource', 'evaluation'])

export type SupportLearnFilterExtras = {
  lectureType?: string
  attendanceStatus?: string
  assignmentPriority?: string
  assignmentCategory?: string
  assignmentModule?: string
  evaluationProgress?: string
  evaluationModule?: string
}

export function supportCategoryUsesLearnApi(categoryId: string): boolean {
  return LEARN_CATEGORY_IDS.has(categoryId)
}

export function supportCategoryToLearningType(categoryId: string): LearningType | null {
  if (categoryId === 'lecture') return 'lecture'
  if (categoryId === 'assignment' || categoryId === 'evaluation') return 'assignment'
  if (categoryId === 'resource') return 'resource'
  return null
}

/** Maps support floater filters to the learn listing API filter payload. */
export function supportCategoryToLearnFilters(
  categoryId: string,
  extra?: SupportLearnFilterExtras,
): BatchLearningFiltersInput | undefined {
  if (categoryId === 'assignment') {
    const filters: BatchLearningFiltersInput = {
      types: ['assignment', 'practice'],
    }
    if (extra?.assignmentPriority && extra.assignmentPriority !== 'any') {
      filters.priorities = [extra.assignmentPriority as LearningPriority]
    }
    if (extra?.assignmentCategory && extra.assignmentCategory !== 'any') {
      filters.categories = [extra.assignmentCategory]
    }
    if (extra?.assignmentModule && extra.assignmentModule !== 'any') {
      filters.modules = [extra.assignmentModule]
    }
    return filters
  }

  if (categoryId === 'evaluation') {
    const filters: BatchLearningFiltersInput = { types: ['evaluation'] }
    if (extra?.evaluationProgress && extra.evaluationProgress !== 'any') {
      filters.assignmentProgressStatuses = [
        extra.evaluationProgress as AssignmentProgressStatus,
      ]
    }
    if (extra?.evaluationModule && extra.evaluationModule !== 'any') {
      filters.modules = [extra.evaluationModule]
    }
    return filters
  }

  if (categoryId === 'lecture' && extra) {
    const filters: BatchLearningFiltersInput = {}
    if (extra.lectureType && extra.lectureType !== 'any') {
      filters.types = [extra.lectureType]
    }
    if (extra.attendanceStatus && extra.attendanceStatus !== 'any') {
      filters.attendanceStatus = extra.attendanceStatus as BatchLearningFiltersInput['attendanceStatus']
    }
    return Object.keys(filters).length > 0 ? filters : undefined
  }

  return undefined
}

function toSupportLectureType(rawType: string): Item['type'] {
  const normalized = rawType.trim().toLowerCase()
  if (normalized === 'live') return 'live'
  if (normalized === 'video') return 'video'
  if (normalized === 'scrum') return 'scrum'
  return undefined
}

export function formatSupportLectureTypeLabel(type: Item['type']): string | null {
  if (type === 'live') return 'Live'
  if (type === 'video') return 'Video'
  if (type === 'scrum') return 'Scrum'
  return null
}

/** Chip colors for Live vs Video so the two kinds are easy to tell apart. */
export function supportLectureTypeChipClassName(type: Item['type']): string {
  if (type === 'live') return 'text-[#b42318] bg-[#fee4e2]'
  if (type === 'video') return 'text-[#175cd3] bg-[#d1e9ff]'
  if (type === 'scrum') return 'text-[#b54708] bg-[#fffaeb]'
  return 'text-[#4338ca] bg-[#e3e3fb]'
}

/** Priority chip styles — mandatory is higher contrast than optional. */
export function supportAssignmentPriorityChipClassName(
  priority: 'optional' | 'mandatory',
): string {
  if (priority === 'mandatory') {
    return 'text-[#b42318] bg-[#fee4e2] ring-1 ring-[#fecdca]'
  }
  return 'text-[#b54708] bg-[#fffaeb]'
}

export function mapLearningItemToSupportItem(item: LearningItem): Item {
  const isAssignmentLike = item.learningType === 'assignment'
  const isLecture = item.learningType === 'lecture'
  const isResource = item.learningType === 'resource'
  const categoryMeta = item.category.trim()
  const moduleMeta = item.moduleName.trim()

  return {
    id: item.id,
    title: item.title,
    meta:
      isAssignmentLike || isResource
        ? categoryMeta || 'Uncategorized'
        : moduleMeta,
    moduleName: isAssignmentLike && moduleMeta ? moduleMeta : undefined,
    date: item.scheduleDate ? formatSocialPostTime(item.scheduleDate) : 'No schedule',
    type: isLecture ? toSupportLectureType(item.type) : undefined,
    startTime: item.scheduleDate ?? undefined,
    isOptional:
      (isAssignmentLike || isResource || isLecture) &&
      item.isOptional === 'recommended',
    isMandatory:
      (isAssignmentLike || isLecture) && item.isOptional === 'mandatory',
  }
}
