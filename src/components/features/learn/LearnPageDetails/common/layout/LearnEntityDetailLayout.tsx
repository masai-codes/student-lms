'use client'

import { LectureDiscussionsSection } from '../../lecture/discussions'
import { LearnDetailDefaultActions } from '../actions'
import { LearnDetailOverview } from '../overview'
import { LearnDetailBodyGrid } from './LearnDetailBodyGrid'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import type { ReactNode } from 'react'
import { formatLectureRangeIST, formatLectureRangeLocal } from '@/utils/timeZoneHandler'

type LearnEntityDetailLayoutProps = {
  detail: LearnHubDetailPayload & {
    scheduleDisplayRange: string
    /** IST wall-clock DB values, localized client-side for the header date. */
    schedule: string | null
    concludes: string | null
  }
  main: ReactNode
  discussionEntityKind: 'assignment' | 'lecture'
  emptyStateContext: 'assignment' | 'resource' | 'lecture'
  mainFooter?: ReactNode
  /** Renders full width above the main/aside grid (e.g. locked-state banner). */
  fullWidthBanner?: ReactNode
  /** Extra chips appended to the overview meta row (e.g. assignment header badges). */
  overviewTrailingChips?: ReactNode
  /** Overrides the default header actions (Raise Ticket + bookmark). */
  headerActions?: ReactNode
}

export function LearnEntityDetailLayout({
  detail,
  main,
  discussionEntityKind,
  emptyStateContext,
  mainFooter,
  fullWidthBanner,
  overviewTrailingChips,
  headerActions,
}: LearnEntityDetailLayoutProps) {
  // The server builds `scheduleDisplayRange` in IST; re-derive it in the viewer's
  // local timezone so the header date matches their device clock. Fall back to
  // the server string, then to `displayDate`, when values are missing.
  const localRange = formatLectureRangeLocal(detail.schedule, detail.concludes)
  const displayDate =
    localRange !== ''
      ? localRange
      : detail.scheduleDisplayRange.trim() !== ''
        ? detail.scheduleDisplayRange
        : detail.displayDate
  // IST version of the localized range, for the hover tooltip when not in IST.
  const displayDateIst =
    localRange !== ''
      ? formatLectureRangeIST(detail.schedule, detail.concludes)
      : undefined

  return (
    <div className="w-full space-y-6 pb-12">
      <LearnDetailOverview
        title={detail.title}
        hostName={detail.hostName}
        displayDate={displayDate}
        displayDateIst={displayDateIst}
        priority={detail.priority}
        tags={detail.tags}
        actions={headerActions ?? <LearnDetailDefaultActions />}
        trailingChips={overviewTrailingChips}
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
