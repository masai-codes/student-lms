'use client'

import {
  LearnDetailBodyGrid,
  LearnDetailDefaultActions,
  LearnDetailOverview,
} from '../common'
import type { LearnHubDetailPayload } from '@/server/learn/types'


type AssignmentDetailPageProps = {
  detail: LearnHubDetailPayload
}

export function AssignmentDetailPage({ detail }: AssignmentDetailPageProps) {
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
        mainPlaceholder="Assignment — main content area"
        asidePlaceholder="Assignment — sidebar area"
      />
    </div>
  )
}
