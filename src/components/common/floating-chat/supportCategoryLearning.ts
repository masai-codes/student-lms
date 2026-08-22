import type {
  BatchLearningFiltersInput,
  LearningItem,
  LearningPriority,
  LearningType,
} from '@/server/learn/types'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import {
  formatSupportLectureDisplayTypeLabel,
  toSupportLectureDisplayType,
} from '@/lib/support/lectureDisplayType'
import type { Item } from './types'
import {
  IITJ_ASSIGNMENT_PRACTICE_ID,
  normalizeFloatingChatCategoryId,
} from './mockData'

const LEARN_CATEGORY_IDS = new Set([
  'lecture',
  'assignment',
  'resource',
  'evaluation',
  IITJ_ASSIGNMENT_PRACTICE_ID,
])

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

export function supportCategoryToLearningType(
  categoryId: string,
): LearningType | null {
  const id = normalizeFloatingChatCategoryId(categoryId)
  if (id === 'lecture') return 'lecture'
  if (id === 'assignment' || id === 'evaluation') return 'assignment'
  if (id === 'resource') return 'resource'
  return null
}

/** Maps support floater filters to the learn listing API filter payload. */
export function supportCategoryToLearnFilters(
  categoryId: string,
  extra?: SupportLearnFilterExtras,
): BatchLearningFiltersInput | undefined {
  const id = normalizeFloatingChatCategoryId(categoryId)
  if (id === 'assignment') {
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

  if (id === 'evaluation') {
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

  if (id === 'lecture' && extra) {
    const filters: BatchLearningFiltersInput = {}
    if (extra.lectureType && extra.lectureType !== 'any') {
      filters.types = [extra.lectureType]
    }
    if (extra.attendanceStatus && extra.attendanceStatus !== 'any') {
      filters.attendanceStatus =
        extra.attendanceStatus as BatchLearningFiltersInput['attendanceStatus']
    }
    return Object.keys(filters).length > 0 ? filters : undefined
  }

  return undefined
}

export {
  formatSupportLectureDisplayTypeLabel as formatSupportLectureTypeLabel,
  supportLectureDisplayTypeChipClassName as supportLectureTypeChipClassName,
  toSupportLectureDisplayType,
} from '@/lib/support/lectureDisplayType'

/** Readable label for any lecture `type` value — known display types get their
 * short label, anything else (e.g. a raw DB value with no dedicated chip
 * style) just gets capitalized rather than hidden. */
export function formatLectureTypeOptionLabel(rawType: string): string {
  const known = formatSupportLectureDisplayTypeLabel(
    toSupportLectureDisplayType(rawType),
  )
  if (known) return known
  const trimmed = rawType.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : rawType
}

/** Priority chip styles — mandatory is higher contrast than optional. */
export function supportAssignmentPriorityChipClassName(
  priority: 'optional' | 'mandatory',
): string {
  if (priority === 'mandatory') {
    return 'text-[#b42318] bg-[#fee4e2] ring-1 ring-[#fecdca] dark:text-danger-subtle-foreground dark:bg-danger-subtle dark:ring-danger/40'
  }
  return 'text-[#b54708] bg-[#fffaeb] dark:text-warning-subtle-foreground dark:bg-warning-subtle'
}

/** Compact schedule line for support floater list + detail cards (client-side). */
export function formatSupportItemScheduleDate(
  schedule: string | null | undefined,
): string {
  return schedule ? formatSocialPostTime(schedule) : 'No schedule'
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
    sectionName: item.sectionName?.trim() || undefined,
    date: formatSupportItemScheduleDate(item.scheduleDate),
    type: isLecture ? toSupportLectureDisplayType(item.type) : undefined,
    startTime: item.scheduleDate ?? undefined,
    isOptional:
      (isAssignmentLike || isResource || isLecture) &&
      item.isOptional === 'recommended',
    isMandatory:
      (isAssignmentLike || isLecture) && item.isOptional === 'mandatory',
  }
}
