'use client'

import { LectureDiscussionsSection } from '../../lecture/discussions'
import { LearnDetailDefaultActions } from '../actions'
import { LearnDetailOverview } from '../overview'
import { LearnDetailBodyGrid } from './LearnDetailBodyGrid'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import type { ReactNode } from 'react'

type LearnEntityDetailLayoutProps = {
  detail: LearnHubDetailPayload & { scheduleDisplayRange: string }
  main: ReactNode
  discussionEntityKind: 'assignment' | 'lecture'
  emptyStateContext: 'assignment' | 'resource' | 'lecture'
  mainFooter?: ReactNode
  /** Renders full width above the main/aside grid (e.g. locked-state banner). */
  fullWidthBanner?: ReactNode
}

export function LearnEntityDetailLayout({
  detail,
  main,
  discussionEntityKind,
  emptyStateContext,
  mainFooter,
  fullWidthBanner,
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
      {fullWidthBanner}
      <LearnDetailBodyGrid
        main={
          <div className="flex flex-col gap-6">
            {main}
            {mainFooter}
          </div>
        }
        aside={
          <LectureDiscussionsSection
            entityId={detail.id}
            entityKind={discussionEntityKind}
            discussions={detail.discussions}
            emptyStateContext={emptyStateContext}
            layout="aside"
            useCreateFormAccordion
          />
        }
      />
    </div>
  )
}
