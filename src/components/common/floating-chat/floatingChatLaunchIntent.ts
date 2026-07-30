import type { SupportEntityCategory } from '@/server/api/support/support.types'

/** Opens the floating chat directly on step 2.5 for a learn detail entity. */
export type FloatingChatEntityLaunchIntent = {
  category: SupportEntityCategory
  entityId: number
}

export function floatingChatEntityLaunchKey(
  intent: FloatingChatEntityLaunchIntent,
): string {
  return `${intent.category}:${intent.entityId}`
}
