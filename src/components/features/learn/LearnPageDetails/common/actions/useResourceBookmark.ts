'use client'

import { useCallback, useState } from 'react'

import {
  addResourceBookmarkViaApi,
  removeResourceBookmarkViaApi,
} from '@/lib/api/learn/learnApi'
import { toast } from '@/lib/toast'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

export interface ResourceBookmarkControls {
  isBookmarked: boolean
  pending: boolean
  toggle: () => void
}

/**
 * Optimistic bookmark toggle for the resource detail header.
 * Mirrors legacy behaviour: add/remove via REST, toast on success,
 * and revert local state if the request fails.
 */
export function useResourceBookmark(
  resourceId: number,
  initialIsBookmarked: boolean,
): ResourceBookmarkControls {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [pending, setPending] = useState(false)

  const toggle = useCallback(() => {
    if (pending) return

    const next = !isBookmarked
    pushLearnEvent(
      learnEntityEvent(
        'resource',
        isBookmarked ? 'bookmark_remove' : 'bookmark_add',
        resourceId,
      ),
      { resource_id: resourceId },
    )
    setIsBookmarked(next)
    setPending(true)

    const request = next
      ? addResourceBookmarkViaApi(resourceId)
      : removeResourceBookmarkViaApi(resourceId)

    request
      .then(() => {
        toast.success(next ? 'Bookmark added' : 'Bookmark removed')
      })
      .catch(() => {
        setIsBookmarked(!next)
        toast.error('Could not update bookmark. Please try again.')
      })
      .finally(() => {
        setPending(false)
      })
  }, [isBookmarked, pending, resourceId])

  return { isBookmarked, pending, toggle }
}
