'use client'

import { LectureStatePanel } from '../shared/LectureStatePanel'
import { formatSqlDate } from '@/utils/generics'

type BeforeVideoLectureProps = {
  schedule: string | null
}

export function BeforeVideoLecture({ schedule }: BeforeVideoLectureProps) {
  const unlockLabel =
    schedule != null && schedule.trim() !== ''
      ? formatSqlDate(schedule)
      : 'the scheduled time'

  return (
    <LectureStatePanel
      title="Video lecture hasn't started yet"
      description={
        <>
          The video will unlock at{' '}
          <span className="type-b2-md text-gray-900">{unlockLabel}</span>.
        </>
      }
    />
  )
}
