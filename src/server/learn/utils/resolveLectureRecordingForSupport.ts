import type {
  LiveLecturePhase,
  VideoLecturePhase,
} from '@/server/learn/lectureDetailTypes'
import { isSalLectureRecordingAvailable } from '@/server/learn/utils/isSalLectureRecordingAvailable'
import {
  readGumletHlsUrl,
  readLectureVideosRecordingUrl,
} from '@/server/learn/utils/resolveLectureVideoUrl'
import { isAdaptiveLectureLink } from '@/server/learn/utils/toLectureScopedAdaptiveLink'
import { verifyUrlReachable } from '@/server/learn/utils/verifyUrlReachable'

/** Support floater budget — fail fast; cached results reuse the full TTL. */
const SUPPORT_RECORDING_PROBE_TIMEOUT_MS = 1_500

type LectureRecordingStatus = 'available' | 'not_available'

export type ResolvedLectureRecording = {
  recordingStatus: LectureRecordingStatus
  recordingUrl: string | null
  recordingVerified: boolean
}

async function resolveRecordingFromUrl(
  url: string,
): Promise<ResolvedLectureRecording> {
  const recordingVerified = await verifyUrlReachable(url, {
    timeoutMs: SUPPORT_RECORDING_PROBE_TIMEOUT_MS,
  })
  return {
    recordingStatus: recordingVerified ? 'available' : 'not_available',
    recordingUrl: url,
    recordingVerified,
  }
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
  const notAvailable: ResolvedLectureRecording = {
    recordingStatus: 'not_available',
    recordingUrl: null,
    recordingVerified: false,
  }

  // SAL (adaptive) lectures — recording availability is time-based, not gumlet/videos.
  if (input.lectureKind === 'live' && isAdaptiveLectureLink(input.zoomLink)) {
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

    return notAvailable
  }

  if (input.hideVideo) {
    return notAvailable
  }

  const isSessionPending =
    (input.lectureKind === 'live' &&
      input.livePhase != null &&
      input.livePhase !== 'after') ||
    (input.lectureKind === 'video' && input.videoPhase === 'before')

  if (isSessionPending) {
    return notAvailable
  }

  const gumletUrl = readGumletHlsUrl(input.vimeoDownloadLinks)
  if (gumletUrl != null) {
    return resolveRecordingFromUrl(gumletUrl)
  }

  const videosUrl = readLectureVideosRecordingUrl(input.videos)
  if (videosUrl != null) {
    return resolveRecordingFromUrl(videosUrl)
  }

  return notAvailable
}
