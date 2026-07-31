export type SupportNavigateCategory =
  | 'lecture'
  | 'assignment'
  | 'resource'
  | 'evaluation'

const SUPPORT_NAVIGATE_CATEGORIES = new Set<SupportNavigateCategory>([
  'lecture',
  'assignment',
  'resource',
  'evaluation',
])

export function isSupportNavigateCategory(
  category: string,
): category is SupportNavigateCategory {
  return SUPPORT_NAVIGATE_CATEGORIES.has(category as SupportNavigateCategory)
}

/** Notify the LMS mobile app WebView to open the native learn screen. */
export function dispatchSupportNavigate(input: {
  category: string
  entityId: string | number | null | undefined
}): void {
  const { category, entityId } = input
  if (!isSupportNavigateCategory(category)) return
  if (entityId == null || entityId === '') return
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent('support-navigate', {
      detail: { category, entityId: String(entityId) },
    }),
  )
}
