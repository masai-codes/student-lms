import type { LectureVideoAttendanceState } from '@/server/learn/lectureDetailTypes'
import { fetchVideoAttendanceIntervals } from '@/server/video-attendance/services/fetchVideoAttendanceIntervals'
import { fetchVideoProgress } from '@/server/video-attendance/services/fetchVideoProgress'
import { normalizeAndMergeIntervals } from '@/server/video-attendance/utils/normalizeAndMergeIntervals'

export async function buildLectureVideoAttendanceState(
  userId: number,
  lectureId: number,
): Promise<LectureVideoAttendanceState | null> {
  const [progress, intervals] = await Promise.all([
    fetchVideoProgress(lectureId, userId),
    fetchVideoAttendanceIntervals(lectureId, userId),
  ])

  if (progress == null && intervals == null) {
    return null
  }

  const lastWatchedPosition =
    progress?.lastWatchedPosition ?? intervals?.lastWatchedPosition ?? 0
  const totalDuration = progress?.totalDuration ?? null
  const durationForMerge =
    typeof totalDuration === 'number' && Number.isFinite(totalDuration)
      ? totalDuration
      : 0

  return {
    lastWatchedPosition,
    totalDuration,
    watchPercentage: progress?.watchPercentage ?? 0,
    mergedIntervals: normalizeAndMergeIntervals(
      intervals?.intervals ?? [],
      durationForMerge,
    ),
  }
}
