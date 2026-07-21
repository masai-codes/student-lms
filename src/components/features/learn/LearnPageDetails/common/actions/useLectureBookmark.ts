'use client'

import { useCallback, useState } from 'react'

import {
  addLectureBookmarkViaApi,
  removeLectureBookmarkViaApi,
} from '@/lib/api/learn/learnApi'
import { toast } from '@/lib/toast'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

export interface LectureBookmarkControls {
  isBookmarked: boolean
  pending: boolean
  toggle: () => void
}

/**
 * Optimistic bookmark toggle for the lecture detail header.
 * Mirrors the resource bookmark behaviour: add/remove via REST, toast on
 * success, and revert local state if the request fails.
 */
export function useLectureBookmark(
  lectureId: number,
  initialIsBookmarked: boolean,
): LectureBookmarkControls {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [pending, setPending] = useState(false)

  const toggle = useCallback(() => {
    if (pending) return

    const next = !isBookmarked
    pushLearnEvent(
      learnEntityEvent(
        'lecture',
        isBookmarked ? 'bookmark_remove' : 'bookmark_add',
        lectureId,
      ),
      { lecture_id: lectureId },
    )
    setIsBookmarked(next)
    setPending(true)

    const request = next
      ? addLectureBookmarkViaApi(lectureId)
      : removeLectureBookmarkViaApi(lectureId)

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
  }, [isBookmarked, lectureId, pending])

  return { isBookmarked, pending, toggle }
}
