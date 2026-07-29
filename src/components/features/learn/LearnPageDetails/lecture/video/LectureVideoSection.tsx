'use client'

import { LectureReactPlayer } from './LectureReactPlayer'
import { LectureVideoFullBleed } from './LectureVideoFullBleed'

import type {
  LectureTranscriptSource,
  LectureVideoAttendanceState,
} from '@/server/learn/lectureDetailTypes'
import { cn } from '@/lib/utils'

type LectureVideoSectionProps = {
  lectureId: number
  videoUrl: string
  initialAttendance: LectureVideoAttendanceState | null
  /** Pointer to the transcript; captions fetch it the first time CC is enabled. */
  transcript?: LectureTranscriptSource
  className?: string
  /** When false, video stays in its column within a split row. */
  fullBleed?: boolean
  /** Reports the intrinsic video aspect ratio (w/h) once metadata loads. */
  onVideoAspectRatioChange?: (ratio: number) => void
}

export function LectureVideoSection({
  lectureId,
  videoUrl,
  initialAttendance,
  transcript,
  className,
  fullBleed = true,
  onVideoAspectRatioChange,
}: LectureVideoSectionProps) {
  const player = (
    <LectureReactPlayer
      lectureId={lectureId}
      src={videoUrl}
      initialAttendance={initialAttendance}
      transcript={transcript}
      onVideoAspectRatioChange={onVideoAspectRatioChange}
    />
  )

  if (!fullBleed) {
    return (
      <div
        data-testid="lecture-video-section"
        className={cn('flex min-h-0 flex-1 flex-col bg-black', className)}
      >
        {player}
      </div>
    )
  }

  return (
    <LectureVideoFullBleed
      testId="lecture-video-section"
      className={cn('flex min-h-0 flex-col', className)}
    >
      {player}
    </LectureVideoFullBleed>
  )
}
