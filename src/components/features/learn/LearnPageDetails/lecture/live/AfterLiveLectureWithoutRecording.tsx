'use client'

import { LectureStatePanel } from '../shared/LectureStatePanel'

export function AfterLiveLectureWithoutRecording() {
  return (
    <LectureStatePanel
      icon="video"
      title="Recording not available yet"
      description="This live lecture has ended. The recording is still being processed and will show up here once it is ready."
    />
  )
}
