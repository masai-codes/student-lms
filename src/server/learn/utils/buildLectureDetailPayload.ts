import type {
  LectureDetailPayload,
  LectureDetailTabContent,
  LectureFeedbackState,
  LectureKind, LectureVideoAttendanceState 
} from '@/server/learn/lectureDetailTypes'
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
import { toLectureScopedAdaptiveLink } from '@/server/learn/utils/toLectureScopedAdaptiveLink'

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

function normalizeLectureKind(type: string): LectureKind | null {
  const normalized = type.trim().toLowerCase()
  // `scrum` is a live-class variant (Zoom join + optional recording), so it is
  // treated as `live` here — mirroring the listing/dashboard `('live','scrum')`
  // grouping and the legacy LMS `is_live` computation.
  if (normalized === 'live' || normalized === 'scrum') {
    return 'live'
  }
  if (normalized === 'video') {
    return 'video'
  }
  return null
}

export function buildLectureDetailPayload(
  core: LearnHubDetailPayload,
  row: LectureDetailRow,
  nowMs: number,
  tabs: LectureDetailTabContent,
  videoAttendance: LectureVideoAttendanceState | null,
  attendance: LectureAttendanceSummary | null,
  feedbackRecord: { rating: number | null; text: string | null },
): Omit<LectureDetailPayload, 'isBookmarked' | 'isNewZoomRedirection'> {
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
    scheduleDisplayRange: formatLectureScheduleRange(row.schedule, row.concludes),
    hostAvatarUrl: row.hostAvatarUrl,
    hideVideo: settings.hideVideo,
    hideNotes: settings.hideNotes,
    notes: tabs.notes,
    tabs,
    videoUrl,
    zoomLink,
    livePhase,
    videoPhase,
    hasRecording,
    joinLiveButtonState,
    videoAttendance: hasRecording ? videoAttendance : null,
    attendance,
    feedback,
  }
}

export function isSupportedLectureDetailType(type: string): boolean {
  return normalizeLectureKind(type) != null
}
