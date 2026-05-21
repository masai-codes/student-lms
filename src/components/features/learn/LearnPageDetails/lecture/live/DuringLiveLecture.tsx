'use client'

import { useEffect, useState } from 'react'

import { LectureStatePanel } from '../shared/LectureStatePanel'
import { JoinLiveSessionCard } from './JoinLiveSessionCard'
import { resolveJoinLiveButtonState } from './utils/resolveJoinLiveButtonState'

type DuringLiveLectureProps = {
  schedule: string | null
  concludes: string | null
  zoomLink: string | null
}

export function DuringLiveLecture({
  schedule,
  concludes,
  zoomLink,
}: DuringLiveLectureProps) {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const buttonState = resolveJoinLiveButtonState({
    schedule,
    concludes,
    nowMs,
    zoomLink,
  })

  return (
    <LectureStatePanel
      icon="video"
      title="Live session in progress"
      description="Join the live classroom while the session is running. The recording will appear here after the lecture ends."
      action={
        zoomLink ? (
          <JoinLiveSessionCard zoomLink={zoomLink} buttonState={buttonState} />
        ) : (
          <p className="type-b2-regular max-w-sm text-gray-500">
            The join link is not available yet. Check back closer to the start time.
          </p>
        )
      }
    />
  )
}
