'use client'

import { LectureDetailChrome } from '../shared/LectureDetailChrome'
import { LectureDetailFooter } from '../shared/LectureDetailFooter'
import { BeforeVideoLecture } from './BeforeVideoLecture'
import { DuringAfterVideoLecture } from './DuringAfterVideoLecture'

import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

type VideoLectureContentProps = {
  detail: LectureDetailPayload
}

function renderVideoHero(detail: LectureDetailPayload) {
  switch (detail.videoPhase) {
    case 'before':
      return <BeforeVideoLecture schedule={detail.schedule} />
    case 'during_after':
      return <DuringAfterVideoLecture detail={detail} />
    default:
      return <BeforeVideoLecture schedule={detail.schedule} />
  }
}

export function VideoLectureContent({ detail }: VideoLectureContentProps) {
  if (
    detail.videoPhase === 'during_after' &&
    detail.hasRecording &&
    detail.videoUrl
  ) {
    return <DuringAfterVideoLecture detail={detail} />
  }

  return (
    <LectureDetailChrome
      title={detail.title}
      hostName={detail.hostName}
      hostAvatarUrl={detail.hostAvatarUrl}
      scheduleDisplayRange={detail.scheduleDisplayRange}
      hero={renderVideoHero(detail)}
      footer={
        <LectureDetailFooter entityId={detail.id} discussions={detail.discussions} />
      }
    />
  )
}
