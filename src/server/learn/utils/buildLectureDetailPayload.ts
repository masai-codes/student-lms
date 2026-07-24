import type {
  LectureDetailPayload,
  LectureDetailTabContent,
  LectureFeedbackState,
  LectureVideoAttendanceState,
} from '@/server/learn/lectureDetailTypes'
import { normalizeLectureKind } from '@/server/learn/utils/normalizeLectureKind'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import type { LectureAttendanceSummary } from '@/server/attendance/types'
import { formatLectureScheduleRange } from '@/server/learn/utils/formatLectureScheduleRange'
import { parseLectureSettings } from '@/server/learn/utils/parseLectureSettings'
import { resolveLectureFeedbackWindow } from '@/server/learn/utils/resolveLectureFeedbackWindow'
import { resolveLiveLecturePhase } from '@/server/learn/utils/resolveLiveLecturePhase'
import { resolveLectureVideoUrl } from '@/server/learn/utils/resolveLectureVideoUrl'
import { resolveJoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { resolveVideoLecturePhase } from '@/server/learn/utils/resolveVideoLecturePhase'
import { scrubZoomLinkForSchedule } from '@/server/learn/utils/scrubZoomLinkForSchedule'
import {
  isAdaptiveLectureLink,
  toLectureScopedAdaptiveLink,
} from '@/server/learn/utils/toLectureScopedAdaptiveLink'

type LectureDetailRow = {
  type: string
  schedule: string | null
  concludes: string | null
  zoomLink: string | null
  videos: unknown
  vimeoDownloadLinks: unknown
  vimeoPlayerEmbedUrl: string | null
  settings: unknown
  hostAvatarUrl: string | null
  notes: string | null
}

export function buildLectureDetailPayload(
  core: LearnHubDetailPayload,
  row: LectureDetailRow,
  nowMs: number,
  tabs: LectureDetailTabContent,
  videoAttendance: LectureVideoAttendanceState | null,
  attendance: LectureAttendanceSummary | null,
  optionalAttendance: LectureAttendanceSummary | null,
  feedbackRecord: { rating: number | null; text: string | null },
): Omit<
  LectureDetailPayload,
  'isBookmarked' | 'isNewZoomRedirection' | 'enableZoomWebView'
> {
  const lectureKind = normalizeLectureKind(row.type)
  if (lectureKind == null) {
    throw new Error('LECTURE_DETAIL_UNSUPPORTED_TYPE')
  }

  const settings = parseLectureSettings(row.settings)
  const videoUrl = settings.hideVideo
    ? null
    : resolveLectureVideoUrl({
        videos: row.videos,
        vimeoDownloadLinks: row.vimeoDownloadLinks,
        vimeoPlayerEmbedUrl: row.vimeoPlayerEmbedUrl,
      })

  const hasRecording = videoUrl != null
  const livePhase =
    lectureKind === 'live'
      ? resolveLiveLecturePhase({
          schedule: row.schedule,
          concludes: row.concludes,
          nowMs,
        })
      : null

  const videoPhase =
    lectureKind === 'video'
      ? resolveVideoLecturePhase({ schedule: row.schedule, nowMs })
      : null

  const zoomLink =
    lectureKind === 'live' && livePhase !== 'before'
      ? toLectureScopedAdaptiveLink(
          scrubZoomLinkForSchedule({
            zoomLink: row.zoomLink,
            schedule: row.schedule,
            nowMs,
          }),
          core.id,
        )
      : null

  // SAL (adaptive) recordings live on the adaptive platform, not in `videoUrl`.
  // After the lecture ends, the lecture-scoped adaptive link redirects to the
  // recording, so surface it as the "Watch Recording" link (only when there is
  // no native recording to prefer). `zoomLink` is already scrubbed + scoped.
  const adaptiveRecordingUrl =
    lectureKind === 'live' &&
    livePhase === 'after' &&
    !hasRecording &&
    isAdaptiveLectureLink(zoomLink)
      ? zoomLink
      : null

  const joinLiveButtonState =
    lectureKind === 'live'
      ? resolveJoinLiveButtonState({
          schedule: row.schedule,
          concludes: row.concludes,
          nowMs,
          zoomLink: row.zoomLink,
        })
      : null

  const feedback: LectureFeedbackState = {
    canSubmit: resolveLectureFeedbackWindow({
      schedule: row.schedule,
      concludes: row.concludes,
      nowMs,
      showFeedback: settings.showFeedback,
    }),
    rating: feedbackRecord.rating,
    text: feedbackRecord.text,
  }

  return {
    ...core,
    lectureKind,
    schedule: row.schedule,
    concludes: row.concludes,
    scheduleDisplayRange: formatLectureScheduleRange(
      row.schedule,
      row.concludes,
    ),
    hostAvatarUrl: row.hostAvatarUrl,
    hideVideo: settings.hideVideo,
    hideNotes: settings.hideNotes,
    notes: tabs.notes,
    tabs,
    videoUrl,
    zoomLink,
    adaptiveRecordingUrl,
    livePhase,
    videoPhase,
    hasRecording,
    joinLiveButtonState,
    videoAttendance: hasRecording ? videoAttendance : null,
    attendance,
    optionalAttendance,
    feedback,
  }
}

export function isSupportedLectureDetailType(type: string): boolean {
  return normalizeLectureKind(type) != null
}
