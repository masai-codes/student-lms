'use client'

import { LectureReactPlayer } from './LectureReactPlayer'
import { LectureVideoFullBleed } from './LectureVideoFullBleed'

import { cn } from '@/lib/utils'

type LectureVideoSectionProps = {
  videoUrl: string
  className?: string
}

export function LectureVideoSection({ videoUrl, className }: LectureVideoSectionProps) {
  return (
    <LectureVideoFullBleed className={cn('flex min-h-0 flex-col', className)}>
      <LectureReactPlayer src={videoUrl} />
    </LectureVideoFullBleed>
  )
}
