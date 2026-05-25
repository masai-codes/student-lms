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

  let response: Response
  try {
    response = await experienceApiFetch(
      `/video-attendances/progress/${lectureId}/intervals`,
    )
  } catch (error) {
    // Upstream unreachable (e.g. ECONNREFUSED). Treat as "no intervals yet"
    // so the lecture page can still render.
    console.warn(
      'fetchVideoAttendanceIntervals: experience API unreachable',
      error,
    )
    return null
  }

  if (!response.ok) return null

  const body = (await response.json()) as ApiEnvelope<VideoAttendanceIntervalsData>
  if (!body.success || !body.data) return null
  return body.data
}
