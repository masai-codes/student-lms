'use client'

import { LearnDetailFullWidthBanner } from '../../common/layout/LearnDetailFullWidthBanner'
import { getAssignmentNotStartedBannerCopy } from './getAssignmentNotStartedBannerCopy'

import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'
import { formatSqlDate } from '@/utils/generics'

type AssignmentNotStartedBannerProps = {
  detail: AssignmentDetailPayload
}

function formatUnlockScheduleLabel(schedule: string | null): string {
  if (schedule == null || schedule.trim() === '') {
    return 'the scheduled time'
  }
  return formatSqlDate(schedule)
}

export function AssignmentNotStartedBanner({
  detail,
}: AssignmentNotStartedBannerProps) {
  const copy = getAssignmentNotStartedBannerCopy(detail.assignmentKind)
  const scheduleLabel = formatUnlockScheduleLabel(detail.schedule)

  return (
    <LearnDetailFullWidthBanner
      title={copy.title}
      testId="assignment-not-started-banner"
    >
      {copy.description}{' '}
      <span className="type-b2-md text-foreground">{scheduleLabel}</span>
    </LearnDetailFullWidthBanner>
  )
}
