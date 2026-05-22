import { experienceApiFetch } from '../experienceApiFetch'
import type { VideoAttendanceIntervalsData } from '../types'

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export async function fetchVideoAttendanceIntervals(
  lectureId: number,
): Promise<VideoAttendanceIntervalsData | null> {
  if (!Number.isFinite(lectureId) || lectureId <= 0) return null

  const response = await experienceApiFetch(
    `/video-attendances/progress/${lectureId}/intervals`,
  )

  if (!response.ok) return null

  const body = (await response.json()) as ApiEnvelope<VideoAttendanceIntervalsData>
  if (!body.success || !body.data) return null
  return body.data
}
