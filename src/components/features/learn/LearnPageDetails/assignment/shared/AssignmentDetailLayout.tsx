'use client'

import {
  LearnDetailBodyGrid,
  LearnDetailDefaultActions,
  LearnDetailOverview,
} from '../../common'

import { EntityDiscussionsPanel } from '@/components/features/new-discussions'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'
import type { ReactNode } from 'react'

type AssignmentDetailLayoutProps = {
  detail: AssignmentDetailPayload
  main: ReactNode
}

export function AssignmentDetailLayout({ detail, main }: AssignmentDetailLayoutProps) {
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
            {detail.instructions ? (
              <section data-testid="assignment-instructions">
                <h2 className="type-h6 text-gray-900">Instructions</h2>
                <div className="type-b2-regular mt-3 whitespace-pre-wrap text-gray-700">
                  {detail.instructions}
                </div>
              </section>
            ) : null}
          </div>
        }
        aside={
          <EntityDiscussionsPanel
            entityKind="assignment"
            entityId={detail.id}
            discussions={detail.discussions}
            emptyStateContext="assignment"
          />
        }
      />
    </div>
  )
}
