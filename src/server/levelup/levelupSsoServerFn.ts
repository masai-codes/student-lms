import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import type { LevelupSsoSuccessBody } from '@/server/levelup/getLevelupSsoResponse'
import { getLevelupSsoResult } from '@/server/levelup/getLevelupSsoResponse'

/**
 * Same contract as `experience-api` `GET /levelup-sso` (for same-origin TanStack RPC).
 */
export const getLevelupSso = createServerFn({ method: 'GET' }).handler(async (): Promise<LevelupSsoSuccessBody> => {
  const cookie = getRequest().headers.get('cookie')
  const result = await getLevelupSsoResult(cookie)

  if (result.status === 401) {
    throw new Error('Unauthorized')
  }
  if (result.status === 500) {
    throw new Error(result.body.message)
  }

  return result.body
})
