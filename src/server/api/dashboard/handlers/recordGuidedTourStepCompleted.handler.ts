import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { recordGuidedTourStepCompleted } from '@/server/api/dashboard/recordGuidedTourStepCompleted.service'

export async function handleRecordGuidedTourStepCompleted(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = await request.json() as {
      lectureId: number
      batchId: number
      tab: 'lms' | 'program'
      watchedSeconds: number
    }
    const watchedSeconds = Number(body.watchedSeconds)
    await recordGuidedTourStepCompleted(userId, {
      lectureId: Number(body.lectureId),
      batchId: Number(body.batchId),
      tab: body.tab === 'program' ? 'program' : 'lms',
      watchedSeconds: Number.isFinite(watchedSeconds) ? watchedSeconds : 0,
    })
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to record guided tour step completed', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_RECORDING_GUIDED_TOUR_STEP'))
    }
    return mapThrownErrorToResponse(error)
  }
}
