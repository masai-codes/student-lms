import type { LiveLecturePhase, VideoLecturePhase } from '@/server/learn/lectureDetailTypes'
import { isLectureSessionEnded } from '@/server/learn/utils/isLectureSessionEnded'
import { isSalLectureRecordingAvailable } from '@/server/learn/utils/isSalLectureRecordingAvailable'
import {
  readGumletHlsUrl,
  readLectureVideosMp4Url,
} from '@/server/learn/utils/resolveLectureVideoUrl'
import { isAdaptiveLectureLink } from '@/server/learn/utils/toLectureScopedAdaptiveLink'
import { verifyUrlReachable } from '@/server/learn/utils/verifyUrlReachable'

export type LectureRecordingStatus =
  | 'pending'
  | 'available'
  | 'not_available'
  | 'processing'

export type ResolvedLectureRecording = {
  recordingStatus: LectureRecordingStatus
  recordingUrl: string | null
  recordingVerified: boolean
}

export async function resolveLectureRecordingForSupport(input: {
  zoomLink: string | null
  schedule: string | null
  concludes: string | null
  nowMs: number
  vimeoDownloadLinks: unknown
  videos: unknown
  hideVideo: boolean
  lectureKind: 'live' | 'video'
  livePhase: LiveLecturePhase | null
  videoPhase: VideoLecturePhase | null
}): Promise<ResolvedLectureRecording> {
  // SAL (adaptive) lectures first — recording availability is time-based, not gumlet.
  if (
    input.lectureKind === 'live' &&
    isAdaptiveLectureLink(input.zoomLink)
  ) {
    if (
      isSalLectureRecordingAvailable({
        zoomLink: input.zoomLink,
        schedule: input.schedule,
        concludes: input.concludes,
        nowMs: input.nowMs,
      })
    ) {
      return {
        recordingStatus: 'available',
        recordingUrl: null,
        recordingVerified: true,
      }
    }

    const sessionEnded = isLectureSessionEnded({
      schedule: input.schedule,
      concludes: input.concludes,
      nowMs: input.nowMs,
    })

    return {
      recordingStatus: sessionEnded ? 'not_available' : 'pending',
      recordingUrl: null,
      recordingVerified: false,
    }
  }

  if (input.hideVideo) {
    return {
      recordingStatus: 'not_available',
      recordingUrl: null,
      recordingVerified: false,
    }
  }

  const isSessionPending =
    (input.lectureKind === 'live' &&
      input.livePhase != null &&
      input.livePhase !== 'after') ||
    (input.lectureKind === 'video' && input.videoPhase === 'before')

  if (isSessionPending) {
    return {
      recordingStatus: 'pending',
      recordingUrl: null,
      recordingVerified: false,
    }
  }

  const gumletUrl = readGumletHlsUrl(input.vimeoDownloadLinks)
  if (gumletUrl != null) {
    const recordingVerified = await verifyUrlReachable(gumletUrl)
    return {
      recordingStatus: recordingVerified ? 'available' : 'processing',
      recordingUrl: gumletUrl,
      recordingVerified,
    }
  }

  const mp4Url = readLectureVideosMp4Url(input.videos)
  if (mp4Url != null) {
    const recordingVerified = await verifyUrlReachable(mp4Url)
    return {
      recordingStatus: recordingVerified ? 'available' : 'not_available',
      recordingUrl: mp4Url,
      recordingVerified,
    }
  }

  return {
    recordingStatus: 'not_available',
    recordingUrl: null,
    recordingVerified: false,
  }
}
