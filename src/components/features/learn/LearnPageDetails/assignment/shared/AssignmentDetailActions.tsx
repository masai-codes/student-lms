'use client'

import {
  LearnDetailDefaultActions,
  useAssignmentBookmark,
} from '../../common/actions'

import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'

type AssignmentDetailActionsProps = {
  assignmentId: number
  initialIsBookmarked: boolean
  assignmentKind: AssignmentKind
}

/** Header actions for the assignment detail page — Raise Ticket + wired bookmark. */
export function AssignmentDetailActions({
  assignmentId,
  initialIsBookmarked,
  assignmentKind,
}: AssignmentDetailActionsProps) {
  const bookmark = useAssignmentBookmark(assignmentId, initialIsBookmarked)

  return (
    <LearnDetailDefaultActions
      bookmark={bookmark}
      ticketCategory={assignmentKind === 'evaluation' ? 'evaluation' : 'assignment'}
      entityId={assignmentId}
    />
  )
}
