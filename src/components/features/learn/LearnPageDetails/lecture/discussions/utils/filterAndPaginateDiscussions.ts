import type { DiscussionListItem } from '@/server/learn/types'

export type DiscussionListFilters = {
  /** Free-text query matched (case-insensitive) against title and message preview. */
  search: string
  /** When true, keep only discussions authored by `currentUserId`. */
  mineOnly: boolean
  currentUserId: number | null
}

/**
 * Filter the detail-page discussion list by the "My discussions" toggle and a
 * free-text search. Mirrors the old LMS behaviour (search on title) but also
 * matches the message preview since it is already loaded on the client.
 */
export function filterDiscussions(
  discussions: Array<DiscussionListItem>,
  { search, mineOnly, currentUserId }: DiscussionListFilters,
): Array<DiscussionListItem> {
  const query = search.trim().toLowerCase()

  return discussions.filter((discussion) => {
    if (mineOnly) {
      if (currentUserId == null || discussion.author?.id !== currentUserId) {
        return false
      }
    }

    if (query) {
      const haystack =
        `${discussion.title} ${discussion.messagePreview}`.toLowerCase()
      if (!haystack.includes(query)) {
        return false
      }
    }

    return true
  })
}

/** Return the slice of `items` for a 1-based `page` of size `pageSize`. */
export function paginate<T>(
  items: Array<T>,
  page: number,
  pageSize: number,
): Array<T> {
  const start = Math.max(0, (page - 1) * pageSize)
  return items.slice(start, start + pageSize)
}

/** Total number of pages needed for `itemCount`; always at least 1. */
export function totalPageCount(itemCount: number, pageSize: number): number {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(itemCount / pageSize))
}
