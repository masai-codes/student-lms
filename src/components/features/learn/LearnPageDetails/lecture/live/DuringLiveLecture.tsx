'use client'

import { LectureStartsInCountdown } from './LectureStartsInCountdown'
import { LectureStatePanel } from '../shared/LectureStatePanel'
import { JoinLiveSessionCard } from './JoinLiveSessionCard'

import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'

type DuringLiveLectureProps = {
  lectureId: number
  schedule: string | null
  zoomLink: string | null
  joinLiveButtonState: JoinLiveButtonState
  isNewZoomRedirection: boolean
}

export function DuringLiveLecture({
  lectureId,
  schedule,
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
        <div className="flex w-full flex-col items-center gap-5">
          {/* Keep the countdown running down to 00:00:00 next to the join CTA;
              it also auto-refetches at the 5-min mark so the button enables. */}
          <LectureStartsInCountdown schedule={schedule} />
          {zoomLink ? (
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
          )}
        </div>
      }
    />
  )
}
