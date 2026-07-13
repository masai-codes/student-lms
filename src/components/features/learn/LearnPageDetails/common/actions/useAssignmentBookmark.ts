'use client'

import { useCallback, useState } from 'react'

import {
  addAssignmentBookmarkViaApi,
  removeAssignmentBookmarkViaApi,
} from '@/lib/api/learn/learnApi'
import { toast } from '@/lib/toast'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

export interface AssignmentBookmarkControls {
  isBookmarked: boolean
  pending: boolean
  toggle: () => void
}

/**
 * Optimistic bookmark toggle for the assignment detail header.
 * Mirrors the lecture/resource bookmark behaviour: add/remove via REST, toast
 * on success, and revert local state if the request fails.
 */
export function useAssignmentBookmark(
  assignmentId: number,
  initialIsBookmarked: boolean,
): AssignmentBookmarkControls {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [pending, setPending] = useState(false)

  const toggle = useCallback(() => {
    if (pending) return

    const next = !isBookmarked
    pushLearnEvent(
      learnEntityEvent(
        'assignment',
        isBookmarked ? 'bookmark_remove' : 'bookmark_add',
        assignmentId,
      ),
      { assignment_id: assignmentId },
    )
    setIsBookmarked(next)
    setPending(true)

    const request = next
      ? addAssignmentBookmarkViaApi(assignmentId)
      : removeAssignmentBookmarkViaApi(assignmentId)

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
  }, [isBookmarked, assignmentId, pending])

  return { isBookmarked, pending, toggle }
}
