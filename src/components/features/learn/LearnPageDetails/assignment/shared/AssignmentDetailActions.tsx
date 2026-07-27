'use client'

import {
  LearnDetailDefaultActions,
  useAssignmentBookmark,
} from '../../common/actions'

type AssignmentDetailActionsProps = {
  assignmentId: number
  initialIsBookmarked: boolean
}

/** Header actions for the assignment detail page — Raise Ticket + wired bookmark. */
export function AssignmentDetailActions({
  assignmentId,
  initialIsBookmarked,
}: AssignmentDetailActionsProps) {
  const bookmark = useAssignmentBookmark(assignmentId, initialIsBookmarked)

  return (
    <LearnDetailDefaultActions
      bookmark={bookmark}
      ticketCategory="assignment"
      ticketEntityId={assignmentId}
    />
  )
}
