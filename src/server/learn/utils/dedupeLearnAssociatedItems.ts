import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'

export function dedupeLearnAssociatedItems(
  items: Array<LearnAssociatedListItem>,
  exclude?: { kind: LearnAssociatedListItem['kind']; id: number },
): Array<LearnAssociatedListItem> {
  const seen = new Set<string>()
  return items.filter(item => {
    if (
      exclude != null &&
      item.kind === exclude.kind &&
      item.id === exclude.id
    ) {
      return false
    }
    const key = `${item.kind}-${item.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
