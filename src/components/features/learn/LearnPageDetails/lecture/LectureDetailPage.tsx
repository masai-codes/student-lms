'use client'

import { LiveLectureContent } from './live/LiveLectureContent'
import { VideoLectureContent } from './video/VideoLectureContent'
import { LearnBanPage } from '../common/ban/LearnBanNotice'
import type { LectureDetailPayload } from '@/server/learn/lectureDetailTypes'

type LectureDetailPageProps = {
  detail: LectureDetailPayload
}

export function LectureDetailPage({ detail }: LectureDetailPageProps) {
  if (detail.banRestriction?.kind === 'page') {
    return <LearnBanPage />
  }

  if (detail.lectureKind === 'live') {
    return <LiveLectureContent detail={detail} />
  }

  return <VideoLectureContent detail={detail} />
}
