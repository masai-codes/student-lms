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

export function mapLearningItemToSupportItem(item: LearningItem): Item {
  const isLive = item.listingCtas.joinLive === 'active'

  return {
    id: item.id,
    title: item.title,
    meta: item.moduleName,
    date: item.scheduleDate ? formatSocialPostTime(item.scheduleDate) : 'No schedule',
    type: isLive ? 'live' : 'recorded',
    startTime: item.scheduleDate ?? undefined,
  }
}
