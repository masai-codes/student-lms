'use client'

import { LearnDetailMetaCard } from './LearnDetailMetaCard'
import { LearnDetailTitleRow } from './LearnDetailTitleRow'
import type { LearnDetailOverviewProps } from './types'

/**
 * Shared heading + actions row and meta/chip card for all learn detail entity pages.
 */
export function LearnDetailOverview({
  title,
  hostName,
  displayDate,
  priority,
  tags,
  actions,
}: LearnDetailOverviewProps) {
  return (
    <div className="w-full space-y-6">
      <LearnDetailTitleRow title={title} actions={actions} />
      <LearnDetailMetaCard
        hostName={hostName}
        displayDate={displayDate}
        priority={priority}
        tags={tags}
      />
    </div>
  )
}
