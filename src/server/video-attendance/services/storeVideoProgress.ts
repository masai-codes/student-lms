import { experienceApiFetch } from '../experienceApiFetch'
import type { StoreVideoProgressInput } from '../types'

type ApiEnvelope = {
  success: boolean
  message?: string
}

export async function storeVideoProgress(
  input: StoreVideoProgressInput,
): Promise<boolean> {
  const { lectureId, totalDuration, intervals, sessionToken } = input
  if (!Number.isFinite(lectureId) || lectureId <= 0) return false
  if (!Number.isFinite(totalDuration) || totalDuration < 1) return false
  if (!Array.isArray(intervals) || intervals.length === 0) return false

  const response = await experienceApiFetch('/video-attendances/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoId: lectureId,
      totalDuration: Math.round(totalDuration),
      intervals,
      sessionToken,
    }),
  })

  if (!response.ok) return false

  const body = (await response.json()) as ApiEnvelope
  return Boolean(body.success)
}
