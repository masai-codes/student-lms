import { createServerFn } from '@tanstack/react-start'

import type { VideoProgressData } from '@/server/video-attendance/types'
import { getCurrentUserId } from '@/server/auth/getCurrentSessionUserId'
import { fetchVideoProgress } from '@/server/video-attendance/services/fetchVideoProgress'

export const getLectureVideoProgress = createServerFn({ method: 'GET' })
  .inputValidator((data: { lectureId: number }) => data)
  .handler(async ({ data }): Promise<VideoProgressData | null> => {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('UNAUTHORIZED')
    return fetchVideoProgress(data.lectureId)
  })
