import type {
  LectureDetailPayload,
  LectureDetailTabContent,
  LectureKind,
} from '@/server/learn/lectureDetailTypes'
import type { LearnHubDetailPayload } from '@/server/learn/types'
import { formatLectureScheduleRange } from '@/server/learn/utils/formatLectureScheduleRange'
import { parseLectureSettings } from '@/server/learn/utils/parseLectureSettings'
import { resolveLiveLecturePhase } from '@/server/learn/utils/resolveLiveLecturePhase'
import { resolveLectureVideoUrl } from '@/server/learn/utils/resolveLectureVideoUrl'
import { resolveJoinLiveButtonState } from '@/server/learn/utils/resolveJoinLiveButtonState'
import { resolveVideoLecturePhase } from '@/server/learn/utils/resolveVideoLecturePhase'
import { scrubZoomLinkForSchedule } from '@/server/learn/utils/scrubZoomLinkForSchedule'
import type { LectureVideoAttendanceState } from '@/server/learn/lectureDetailTypes'

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

const SUPPORTED_LECTURE_KINDS = new Set<LectureKind>(['live', 'video'])

function normalizeLectureKind(type: string): LectureKind | null {
  const normalized = type.trim().toLowerCase()
  if (normalized === 'live' || normalized === 'video') {
    return normalized
  }
  return null
}

export function buildLectureDetailPayload(
  core: LearnHubDetailPayload,
  row: LectureDetailRow,
  nowMs: number,
  tabs: LectureDetailTabContent,
  videoAttendance: LectureVideoAttendanceState | null,
): LectureDetailPayload {
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
      ? scrubZoomLinkForSchedule({
          zoomLink: row.zoomLink,
          schedule: row.schedule,
          nowMs,
        })
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
  }
}

export function isSupportedLectureDetailType(type: string): boolean {
  return SUPPORTED_LECTURE_KINDS.has(type.trim().toLowerCase() as LectureKind)
}
