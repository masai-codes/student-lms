import type { SupportEntityCategory } from '@/server/api/support/support.types'

const SUPPORT_ENTITY_CATEGORIES = new Set<SupportEntityCategory>([
  'lecture',
  'assignment',
  'resource',
  'evaluation',
])

export type SupportPageContextSearch = {
  category: SupportEntityCategory
  entityId: number
}

/** Parse `/support/context?category=…&entityId=…` search params. */
export function parseSupportPageContextSearch(
  search: Record<string, unknown>,
): SupportPageContextSearch | null {
  const category = typeof search.category === 'string' ? search.category.trim() : ''
  const rawEntityId = search.entityId
  const entityId =
    typeof rawEntityId === 'number'
      ? rawEntityId
      : typeof rawEntityId === 'string'
        ? Number(rawEntityId)
        : Number.NaN

  if (!SUPPORT_ENTITY_CATEGORIES.has(category as SupportEntityCategory)) {
    return null
  }
  if (!Number.isFinite(entityId) || entityId <= 0 || !Number.isInteger(entityId)) {
    return null
  }

  return { category: category as SupportEntityCategory, entityId }
}
