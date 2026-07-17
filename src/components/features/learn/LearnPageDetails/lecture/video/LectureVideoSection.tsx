'use client'

import { LectureReactPlayer } from './LectureReactPlayer'
import { LectureVideoFullBleed } from './LectureVideoFullBleed'

import type {
  LectureTranscriptSegment,
  LectureVideoAttendanceState,
} from '@/server/learn/lectureDetailTypes'
import { cn } from '@/lib/utils'

type LectureVideoSectionProps = {
  lectureId: number
  videoUrl: string
  initialAttendance: LectureVideoAttendanceState | null
  transcriptSegments?: Array<LectureTranscriptSegment>
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
  transcriptSegments,
  className,
  fullBleed = true,
  onVideoAspectRatioChange,
}: LectureVideoSectionProps) {
  const player = (
    <LectureReactPlayer
      lectureId={lectureId}
      src={videoUrl}
      initialAttendance={initialAttendance}
      transcriptSegments={transcriptSegments}
      onVideoAspectRatioChange={onVideoAspectRatioChange}
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
