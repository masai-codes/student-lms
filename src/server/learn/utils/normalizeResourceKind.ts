import type { ResourceKind } from '@/server/learn/resourceDetailTypes'

const PRE_READ_CATEGORIES = new Set([
  'pre-read',
  'pre-reads',
  'pre_read',
  'pre_reads',
  'preread',
  'pre read',
])

const NOTES_CATEGORIES = new Set(['notes', 'note'])

function normalizeCategoryKey(category: string): string {
  return category.trim().toLowerCase().replace(/_/g, '-')
}

export function normalizeResourceKind(category: string): ResourceKind {
  const key = normalizeCategoryKey(category)

  if (PRE_READ_CATEGORIES.has(key)) {
    return 'pre-read'
  }

  if (NOTES_CATEGORIES.has(key)) {
    return 'notes'
  }

  return 'material'
}

export function isSupportedResourceLectureType(type: string): boolean {
  return type.trim().toLowerCase() === 'reading'
}
