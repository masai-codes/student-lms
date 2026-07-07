import type { LectureTranscriptSegment } from '@/server/learn/lectureDetailTypes'
import { resolveHlsDurationSeconds } from '@/server/learn/utils/resolveHlsDurationSeconds'

export type LectureDurationSource = 'hls' | 'transcript' | 'schedule' | 'video_progress'

export type ResolvedLectureDuration = {
  durationSeconds: number | null
  durationSource: LectureDurationSource | null
}

function durationFromTranscriptSegments(
  segments: Array<LectureTranscriptSegment>,
): number | null {
  if (segments.length === 0) return null

  const maxEnd = Math.max(...segments.map((segment) => segment.end))
  if (!Number.isFinite(maxEnd) || maxEnd <= 0) return null

  return Math.round(maxEnd)
}

function durationFromSchedule(
  schedule: string | null,
  concludes: string | null,
): number | null {
  if (schedule == null || concludes == null) return null

  const startMs = new Date(schedule).getTime()
  const endMs = new Date(concludes).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null
  }

  return Math.round((endMs - startMs) / 1000)
}

export async function resolveLectureDuration(input: {
  recordingUrl: string | null
  recordingVerified: boolean
  transcriptSegments: Array<LectureTranscriptSegment>
  schedule: string | null
  concludes: string | null
  videoProgressDurationSeconds: number | null
}): Promise<ResolvedLectureDuration> {
  if (input.recordingVerified && input.recordingUrl != null) {
    const hlsDuration = await resolveHlsDurationSeconds(input.recordingUrl)
    if (hlsDuration != null) {
      return { durationSeconds: hlsDuration, durationSource: 'hls' }
    }
  }

  const transcriptDuration = durationFromTranscriptSegments(input.transcriptSegments)
  if (transcriptDuration != null) {
    return { durationSeconds: transcriptDuration, durationSource: 'transcript' }
  }

  const scheduleDuration = durationFromSchedule(input.schedule, input.concludes)
  if (scheduleDuration != null) {
    return { durationSeconds: scheduleDuration, durationSource: 'schedule' }
  }

  if (
    input.videoProgressDurationSeconds != null &&
    Number.isFinite(input.videoProgressDurationSeconds) &&
    input.videoProgressDurationSeconds > 0
  ) {
    return {
      durationSeconds: Math.round(input.videoProgressDurationSeconds),
      durationSource: 'video_progress',
    }
  }

  return { durationSeconds: null, durationSource: null }
}
