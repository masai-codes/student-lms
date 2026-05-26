import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'

export function getLearnAssociatedItemHref(
  item: LearnAssociatedListItem,
): string {
  if (item.kind === 'lecture') return `/lectures/${item.id}`
  if (item.kind === 'assignment') return `/assignments/${item.id}`
  return `/resources/${item.id}`
}
