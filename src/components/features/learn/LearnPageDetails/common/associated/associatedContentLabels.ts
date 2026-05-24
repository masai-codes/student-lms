import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'

export const ASSOCIATED_CONTENT_DRAWER_TITLE =
  'Associated Lectures & Assignments'

export const ASSOCIATED_CONTENT_SECTION_LABELS: Record<
  LearnAssociatedListItem['kind'],
  string
> = {
  lecture: 'Lectures',
  assignment: 'Assignments',
  resource: 'Resources',
}

export const ASSOCIATED_CONTENT_KIND_ORDER: Array<
  LearnAssociatedListItem['kind']
> = ['lecture', 'resource', 'assignment']
