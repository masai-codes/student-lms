import type { LearningPriority } from '@/server/learn/types'

function capitalizeWord(segment: string): string {
  const trimmed = segment.trim()
  if (trimmed === '') {
    return ''
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

/** Title-style label for tags (type, category, module). */
export function formatLearnDetailTagLabel(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.split('-').map(capitalizeWord).join('-'))
    .join(' ')
}

/** Person name: capitalize each word (e.g. "john doe" → "John Doe"). */
export function formatLearnDetailHostName(name: string): string {
  return formatLearnDetailTagLabel(name)
}

export function formatLearnDetailPriorityLabel(
  priority: LearningPriority,
): string {
  return capitalizeWord(priority)
}
