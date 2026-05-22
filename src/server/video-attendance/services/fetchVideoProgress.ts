import { experienceApiFetch } from '../experienceApiFetch'
import type { VideoProgressData } from '../types'

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export async function fetchVideoProgress(
  lectureId: number,
): Promise<VideoProgressData | null> {
  if (!Number.isFinite(lectureId) || lectureId <= 0) return null

  const response = await experienceApiFetch(
    `/video-attendances/progress/${lectureId}`,
  )

  if (!response.ok) return null

  const body = (await response.json()) as ApiEnvelope<VideoProgressData>
  if (!body.success || !body.data) return null
  return body.data
}
