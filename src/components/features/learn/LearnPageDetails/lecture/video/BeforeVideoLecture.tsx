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
      title="Lecture hasn’t started yet"
      description={
        <>
          Lecture will be unlocked and available at{' '}
          <span className="type-b2-md text-foreground">{unlockLabel}</span>.
        </>
      }
    />
  )
}
