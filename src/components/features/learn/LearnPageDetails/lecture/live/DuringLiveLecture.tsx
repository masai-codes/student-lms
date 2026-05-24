'use client'

import { LectureStatePanel } from '../shared/LectureStatePanel'
import { JoinLiveSessionCard } from './JoinLiveSessionCard'

import type { JoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'

type DuringLiveLectureProps = {
  zoomLink: string | null
  joinLiveButtonState: JoinLiveButtonState
}

export function DuringLiveLecture({
  zoomLink,
  joinLiveButtonState,
}: DuringLiveLectureProps) {
  return (
    <LectureStatePanel
      icon="video"
      title="Live session in progress"
      description="Join the live classroom while the session is running. The recording will appear here after the lecture ends."
      action={
        zoomLink ? (
          <JoinLiveSessionCard zoomLink={zoomLink} buttonState={joinLiveButtonState} />
        ) : (
          <p className="type-b2-regular max-w-sm text-gray-500">
            The join link is not available yet. Check back closer to the start time.
          </p>
        )
      }
    />
  )
}
