'use client'

import { LectureReactPlayer } from './LectureReactPlayer'
import { LectureVideoFullBleed } from './LectureVideoFullBleed'

import { cn } from '@/lib/utils'

type LectureVideoSectionProps = {
  videoUrl: string
  className?: string
  /** When false, video stays in its column (theater layout). */
  fullBleed?: boolean
  isTheaterMode?: boolean
  onTheaterModeToggle?: () => void
}

export function LectureVideoSection({
  videoUrl,
  className,
  fullBleed = true,
  isTheaterMode = false,
  onTheaterModeToggle,
}: LectureVideoSectionProps) {
  const player = (
    <LectureReactPlayer
      src={videoUrl}
      isTheaterMode={isTheaterMode}
      onTheaterModeToggle={onTheaterModeToggle}
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
