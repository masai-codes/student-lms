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
    <div className="w-full pb-12">
      <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-6">
        <div className="space-y-6">
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
      </div>
    </div>
  )
}
