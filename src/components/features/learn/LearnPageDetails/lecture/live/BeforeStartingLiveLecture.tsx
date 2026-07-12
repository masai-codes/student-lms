'use client'

import { LectureStartsInCountdown } from './LectureStartsInCountdown'
import { LectureStatePanel } from '../shared/LectureStatePanel'
import { formatSqlDate } from '@/utils/generics'

type BeforeStartingLiveLectureProps = {
  schedule: string | null
}

export function BeforeStartingLiveLecture({ schedule }: BeforeStartingLiveLectureProps) {
  const unlockLabel =
    schedule != null && schedule.trim() !== ''
      ? formatSqlDate(schedule)
      : 'the scheduled time'

  return (
    <LectureStatePanel
      title="Live lecture hasn't started yet"
      description={
        <>
          This session will unlock at{' '}
          <span className="type-b2-md text-gray-900">{unlockLabel}</span>. You can
          return here when it is time to join.
        </>
      }
      action={<LectureStartsInCountdown schedule={schedule} />}
    />
  )
}
