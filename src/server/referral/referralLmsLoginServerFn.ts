import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import type { ReferralLmsLoginUrlSuccessBody } from '@/server/referral/getReferralLmsLoginUrlResponse'
import { getReferralLmsLoginUrlResult } from '@/server/referral/getReferralLmsLoginUrlResponse'

export const getReferralLmsLoginUrl = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ReferralLmsLoginUrlSuccessBody> => {
    const result = await getReferralLmsLoginUrlResult()

    if (result.status === 401) {
      throw new Error(result.body.error)
    }
    if (result.status === 500) {
      throw new Error(result.body.message ?? result.body.error)
    }

    return result.body
  },
)
