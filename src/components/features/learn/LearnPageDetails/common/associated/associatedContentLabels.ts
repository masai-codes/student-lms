import type { LearnContentType } from '@/components/features/learn/shared/types'

export const ASSOCIATED_CONTENT_DRAWER_TITLE =
  'Associated Lectures & Assignments'

export const ASSOCIATED_CONTENT_SECTION_LABELS: Record<
  LearnContentType,
  string
> = {
  lecture: 'Lectures',
  assignment: 'Assignments',
  resource: 'Resources',
}

export const ASSOCIATED_CONTENT_KIND_ORDER: Array<LearnContentType> = [
  'lecture',
  'resource',
  'assignment',
]
