'use client'

import { LectureStatePanel } from '../shared/LectureStatePanel'

export function DuringAfterVideoLectureWithoutRecording() {
  return (
    <LectureStatePanel
      icon="video"
      title="Video not available yet"
      description="This lecture has started, but the recording is not available yet. Check back once it has been uploaded."
    />
  )
}
