'use client'

import {
  LearnDetailBodyGrid,
  LearnDetailDefaultActions,
  LearnDetailOverview,
} from '../common'
import type { LearnHubDetailPayload } from '@/server/learn/types'


type ResourceDetailPageProps = {
  detail: LearnHubDetailPayload
}

export function ResourceDetailPage({ detail }: ResourceDetailPageProps) {
  return (
    <div className="w-full space-y-6 pb-12">
      <LearnDetailOverview
        title={detail.title}
        hostName={detail.hostName}
        displayDate={detail.displayDate}
        priority={detail.priority}
        tags={detail.tags}
        actions={<LearnDetailDefaultActions />}
      />
      <LearnDetailBodyGrid
        mainPlaceholder="Resource — main content area"
        asidePlaceholder="Resource — sidebar area"
      />
    </div>
  )
}
