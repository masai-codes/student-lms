import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { storeVideoProgress } from '@/server/video-attendance/services/storeVideoProgress'
import { upgradeVideoAttendanceInline } from '@/server/video-attendance/services/upgradeVideoAttendanceInline'

const bodySchema = z.object({
  totalDuration: z.number(),
  intervals: z.array(z.object({ start: z.number(), end: z.number() })),
  sessionToken: z.string().optional(),
})

export async function handleStoreLectureVideoProgress(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    // Auth gate; the upstream experience API is called with the session cookie,
    // and the userId drives the inline attendance upgrade below.
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_VIDEO_PROGRESS_PAYLOAD')
    }

    const ok = await storeVideoProgress({
      lectureId,
      totalDuration: parsed.data.totalDuration,
      intervals: parsed.data.intervals,
      sessionToken: parsed.data.sessionToken,
    })

    // The upstream write creates/updates video_attendances and backfills the
    // attendances / student_attendances rows, but never fires the absent ->
    // present upgrade. Run it here (shared DB) so the new LMS gets the same
    // real-time upgrade behaviour without changing experience-api. Awaited so
    // it completes within the request; it swallows its own errors.
    if (ok) {
      await upgradeVideoAttendanceInline({
        lectureId,
        userId,
        totalDuration: parsed.data.totalDuration,
      })
    }

    return jsonOk({ ok })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
