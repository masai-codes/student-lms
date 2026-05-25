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

  let response: Response
  try {
    response = await experienceApiFetch(
      `/video-attendances/progress/${lectureId}`,
    )
  } catch (error) {
    // Upstream unreachable (e.g. ECONNREFUSED). Treat as "no progress yet"
    // so the lecture page can still render.
    console.warn('fetchVideoProgress: experience API unreachable', error)
    return null
  }

  if (!response.ok) return null

  const body = (await response.json()) as ApiEnvelope<VideoProgressData>
  if (!body.success || !body.data) return null
  return body.data
}
