'use client'

import { LearnDetailMetaCard } from './LearnDetailMetaCard'
import { LearnDetailTitleRow } from './LearnDetailTitleRow'
import type { LearnDetailOverviewProps } from './types'

/**
 * Row 1: title + Raise ticket / bookmark (original layout).
 * Row 2: single flex row — host, date, and chips (no border/card).
 */
export function LearnDetailOverview({
  title,
  hostName,
  displayDate,
  displayDateIst,
  priority,
  tags,
  actions,
  trailingChips,
}: LearnDetailOverviewProps) {
  return (
    <div className="w-full">
      <LearnDetailTitleRow title={title} actions={actions} />
      <LearnDetailMetaCard
        hostName={hostName}
        displayDate={displayDate}
        displayDateIst={displayDateIst}
        priority={priority}
        tags={tags}
        trailingChips={trailingChips}
      />
    </div>
  )
}
