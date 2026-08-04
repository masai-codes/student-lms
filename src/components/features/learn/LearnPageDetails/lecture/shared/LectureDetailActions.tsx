'use client'

import {
  LearnDetailDefaultActions,
  useLectureBookmark,
} from '../../common/actions'

type LectureDetailActionsProps = {
  lectureId: number
  initialIsBookmarked: boolean
}

/** Header actions for the lecture detail page — Raise Ticket + wired bookmark. */
export function LectureDetailActions({
  lectureId,
  initialIsBookmarked,
}: LectureDetailActionsProps) {
  const bookmark = useLectureBookmark(lectureId, initialIsBookmarked)

  return (
    <LearnDetailDefaultActions
      bookmark={bookmark}
      ticketCategory="lecture"
      entityId={lectureId}
    />
  )
}
