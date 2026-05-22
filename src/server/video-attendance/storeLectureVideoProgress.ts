import { createServerFn } from '@tanstack/react-start'

import type { StoreVideoProgressInput } from '@/server/video-attendance/types'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { storeVideoProgress } from '@/server/video-attendance/services/storeVideoProgress'

export const storeLectureVideoProgress = createServerFn({ method: 'POST' })
  .inputValidator((data: StoreVideoProgressInput) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const userId = await getCurrentSessionUserId()
    if (!userId) throw new Error('UNAUTHORIZED')
    const ok = await storeVideoProgress(data)
    return { ok }
  })
