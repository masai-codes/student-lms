import type { LearnDiscussionListItem } from '@/server/learn/types'

export type LearnDiscussionsFilters = {
  /** Free-text query matched (case-insensitive) against title and message preview. */
  search: string
  /** When true, keep only discussions authored by `currentUserId` (never a client-supplied id). */
  mineOnly: boolean
  currentUserId: number | null
  /** 'all' or one of the content types the old LMS filtered by `entity_type`. */
  contentType: 'all' | LearnDiscussionListItem['contentType']
  /** 'all' | 'open' | 'closed', mirroring the old `is_closed` filter. */
  status: 'all' | 'open' | 'closed'
}

/**
 * Filters the batch-wide `/learn/discussions` feed. Mirrors the old LMS
 * `getDiscussions` filters (title, entity_type, is_closed, own-vs-public) but
 * "mine" is always resolved against the viewer's own session id, never a
 * user_id read from the UI.
 */
export function filterLearnDiscussions(
  discussions: Array<LearnDiscussionListItem>,
  {
    search,
    mineOnly,
    currentUserId,
    contentType,
    status,
  }: LearnDiscussionsFilters,
): Array<LearnDiscussionListItem> {
  const query = search.trim().toLowerCase()

  return discussions.filter((discussion) => {
    if (mineOnly) {
      if (currentUserId == null || discussion.author?.id !== currentUserId) {
        return false
      }
    }

    if (contentType !== 'all' && discussion.contentType !== contentType) {
      return false
    }

    if (status !== 'all') {
      const isClosed = status === 'closed'
      if (discussion.isClosed !== isClosed) {
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
