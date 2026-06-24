'use client'

import { LectureStatePanel } from '../shared/LectureStatePanel'
import { JoinLiveSessionCard } from './JoinLiveSessionCard'

import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'

type DuringLiveLectureProps = {
  lectureId: number
  zoomLink: string | null
  joinLiveButtonState: JoinLiveButtonState
  isNewZoomRedirection: boolean
}

export function DuringLiveLecture({
  lectureId,
  zoomLink,
  joinLiveButtonState,
  isNewZoomRedirection,
}: DuringLiveLectureProps) {
  return (
    <LectureStatePanel
      icon="video"
      title="Live session in progress"
      description="Join the live classroom while the session is running. The recording will appear here after the lecture ends."
      action={
        zoomLink ? (
          <JoinLiveSessionCard
            lectureId={lectureId}
            zoomLink={zoomLink}
            buttonState={joinLiveButtonState}
            isNewZoomRedirection={isNewZoomRedirection}
          />
        ) : (
          <p className="type-b2-regular max-w-sm text-gray-500">
            The join link is not available yet. Check back closer to the start time.
          </p>
        )
      }
    />
  )
}
