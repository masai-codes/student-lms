'use client'

import { LiveLectureContent } from './live/LiveLectureContent'
import { VideoLectureContent } from './video/VideoLectureContent'
import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

type LectureDetailPageProps = {
  detail: LectureDetailPayload
}

export function LectureDetailPage({ detail }: LectureDetailPageProps) {
  if (detail.lectureKind === 'live') {
    return <LiveLectureContent detail={detail} />
  }

  return <VideoLectureContent detail={detail} />
}
