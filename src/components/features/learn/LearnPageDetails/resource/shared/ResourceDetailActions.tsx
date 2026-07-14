'use client'

import {
  LearnDetailDefaultActions,
  useResourceBookmark,
} from '../../common/actions'

type ResourceDetailActionsProps = {
  resourceId: number
  initialIsBookmarked: boolean
}

/** Header actions for the resource detail page — Raise Ticket + wired bookmark. */
export function ResourceDetailActions({
  resourceId,
  initialIsBookmarked,
}: ResourceDetailActionsProps) {
  const bookmark = useResourceBookmark(resourceId, initialIsBookmarked)

  return (
    <LearnDetailDefaultActions bookmark={bookmark} ticketCategory="resource" />
  )
}
