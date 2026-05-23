'use client'

import { LearnDetailDefaultActions } from '../actions'
import { LearnDetailOverview } from '../overview'
import { LearnDetailBodyGrid } from './LearnDetailBodyGrid'

import { EntityDiscussionsPanel } from '@/components/features/new-discussions'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import type { ReactNode } from 'react'

type LearnEntityDetailLayoutProps = {
  detail: LearnHubDetailPayload & { scheduleDisplayRange: string }
  main: ReactNode
  discussionEntityKind: 'assignment' | 'lecture'
  emptyStateContext: 'assignment' | 'resource' | 'lecture'
  mainFooter?: ReactNode
}

export function LearnEntityDetailLayout({
  detail,
  main,
  discussionEntityKind,
  emptyStateContext,
  mainFooter,
}: LearnEntityDetailLayoutProps) {
  const displayDate =
    detail.scheduleDisplayRange.trim() !== ''
      ? detail.scheduleDisplayRange
      : detail.displayDate

  return (
    <div className="w-full space-y-6 pb-12">
      <LearnDetailOverview
        title={detail.title}
        hostName={detail.hostName}
        displayDate={displayDate}
        priority={detail.priority}
        tags={detail.tags}
        actions={<LearnDetailDefaultActions />}
      />
      <LearnDetailBodyGrid
        main={
          <div className="flex flex-col gap-6">
            {main}
            {mainFooter}
          </div>
        }
        aside={
          <EntityDiscussionsPanel
            entityKind={discussionEntityKind}
            entityId={detail.id}
            discussions={detail.discussions}
            emptyStateContext={emptyStateContext}
          />
        }
      />
    </div>
  )
}
