'use client'

import { LectureReactPlayer } from './LectureReactPlayer'
import { LectureVideoFullBleed } from './LectureVideoFullBleed'

import type { LectureVideoAttendanceState } from '@/server/learn/lectureDetailTypes'
import { cn } from '@/lib/utils'

type LectureVideoSectionProps = {
  lectureId: number
  videoUrl: string
  initialAttendance: LectureVideoAttendanceState | null
  className?: string
  /** When false, video stays in its column within a split row. */
  fullBleed?: boolean
}

export function LectureVideoSection({
  lectureId,
  videoUrl,
  initialAttendance,
  className,
  fullBleed = true,
}: LectureVideoSectionProps) {
  const player = (
    <LectureReactPlayer
      lectureId={lectureId}
      src={videoUrl}
      initialAttendance={initialAttendance}
    />
  )

  if (!fullBleed) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col bg-black', className)}>
        {player}
      </div>
    )
  }

  return (
    <LectureVideoFullBleed className={cn('flex min-h-0 flex-col', className)}>
      {player}
    </LectureVideoFullBleed>
  )
}
