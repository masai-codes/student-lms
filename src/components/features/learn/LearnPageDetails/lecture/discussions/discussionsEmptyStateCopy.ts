export type LearnDiscussionsEmptyStateContext =
  'lecture' | 'assignment' | 'resource'

export function learnDiscussionsEmptyStateNoun(
  context: LearnDiscussionsEmptyStateContext,
): string {
  if (context === 'assignment') return 'assignment'
  if (context === 'resource') return 'resource'
  return 'lecture'
}
