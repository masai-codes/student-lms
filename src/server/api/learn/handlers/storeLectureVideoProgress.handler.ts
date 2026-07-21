import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { storeVideoProgress } from '@/server/video-attendance/services/storeVideoProgress'

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
    // Native write against the shared DB (no experience-api call); userId scopes
    // the video_attendances/student_attendances rows and the inline upgrade.
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const rawBody = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_VIDEO_PROGRESS_PAYLOAD')
    }

    // storeVideoProgress does the full write natively: upsert video_attendances,
    // backfill attendances / student_attendances, and run the inline absent ->
    // present upgrade.
    const ok = await storeVideoProgress({
      lectureId,
      userId,
      totalDuration: parsed.data.totalDuration,
      intervals: parsed.data.intervals,
      sessionToken: parsed.data.sessionToken,
    })

    return jsonOk({ ok })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
