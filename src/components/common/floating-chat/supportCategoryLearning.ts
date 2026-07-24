import type {
  BatchLearningFiltersInput,
  LearningItem,
  LearningType,
} from '@/server/learn/types'
import { formatSocialPostTime } from '@/lib/socialRelativeTime'
import type { Item } from './types'

const LEARN_CATEGORY_IDS = new Set(['lecture', 'assignment', 'resource', 'evaluation'])

export function supportCategoryUsesLearnApi(categoryId: string): boolean {
  return LEARN_CATEGORY_IDS.has(categoryId)
}

export function supportCategoryToLearningType(categoryId: string): LearningType | null {
  if (categoryId === 'lecture') return 'lecture'
  if (categoryId === 'assignment' || categoryId === 'evaluation') return 'assignment'
  if (categoryId === 'resource') return 'resource'
  return null
}

/** Type filters scoped to each support category (assignments table `type` column). */
export function supportCategoryToLearnFilters(
  categoryId: string,
): BatchLearningFiltersInput | undefined {
  if (categoryId === 'assignment') return { types: ['assignment', 'practice'] }
  if (categoryId === 'evaluation') return { types: ['evaluation'] }
  return undefined
}

function toSupportLectureType(rawType: string): Item['type'] {
  const normalized = rawType.trim().toLowerCase()
  if (normalized === 'live') return 'live'
  if (normalized === 'video') return 'video'
  return undefined
}

export function formatSupportLectureTypeLabel(type: Item['type']): string | null {
  if (type === 'live') return 'Live'
  if (type === 'video') return 'Video'
  return null
}

/** Chip colors for Live vs Video so the two kinds are easy to tell apart. */
export function supportLectureTypeChipClassName(type: Item['type']): string {
  if (type === 'live') return 'text-[#b42318] bg-[#fee4e2]'
  if (type === 'video') return 'text-[#175cd3] bg-[#d1e9ff]'
  return 'text-[#4338ca] bg-[#e3e3fb]'
}

export function mapLearningItemToSupportItem(item: LearningItem): Item {
  const isAssignmentLike = item.learningType === 'assignment'
  const isResource = item.learningType === 'resource'
  const categoryMeta = item.category.trim()

  return {
    id: item.id,
    title: item.title,
    // Assignments/evaluations/resources: category is the useful tag; module is not.
    meta:
      isAssignmentLike || isResource
        ? categoryMeta || 'Uncategorized'
        : item.moduleName,
    date: item.scheduleDate ? formatSocialPostTime(item.scheduleDate) : 'No schedule',
    type: item.learningType === 'lecture' ? toSupportLectureType(item.type) : undefined,
    startTime: item.scheduleDate ?? undefined,
    isOptional:
      (isAssignmentLike || isResource) && item.isOptional === 'recommended',
  }
}
