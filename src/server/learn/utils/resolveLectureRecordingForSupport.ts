import type { LiveLecturePhase, VideoLecturePhase } from '@/server/learn/lectureDetailTypes'
import { readGumletHlsUrl } from '@/server/learn/utils/resolveLectureVideoUrl'
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
  vimeoDownloadLinks: unknown
  hideVideo: boolean
  lectureKind: 'live' | 'video'
  livePhase: LiveLecturePhase | null
  videoPhase: VideoLecturePhase | null
}): Promise<ResolvedLectureRecording> {
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

  const recordingUrl = readGumletHlsUrl(input.vimeoDownloadLinks)
  if (recordingUrl == null) {
    return {
      recordingStatus: 'not_available',
      recordingUrl: null,
      recordingVerified: false,
    }
  }

  const recordingVerified = await verifyUrlReachable(recordingUrl)

  return {
    recordingStatus: recordingVerified ? 'available' : 'processing',
    recordingUrl,
    recordingVerified,
  }
}
