import { createServerFn } from '@tanstack/react-start'

import type { VideoAttendanceIntervalsData } from '@/server/video-attendance/types'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { fetchVideoAttendanceIntervals } from '@/server/video-attendance/services/fetchVideoAttendanceIntervals'

export const getLectureVideoAttendanceIntervals = createServerFn({ method: 'GET' })
  .inputValidator((data: { lectureId: number }) => data)
  .handler(async ({ data }): Promise<VideoAttendanceIntervalsData | null> => {
    const userId = await getCurrentSessionUserId()
    if (!userId) throw new Error('UNAUTHORIZED')
    return fetchVideoAttendanceIntervals(data.lectureId)
  })
