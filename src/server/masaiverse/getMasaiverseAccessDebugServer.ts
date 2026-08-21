import { createServerFn } from '@tanstack/react-start'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import type { MasaiverseAccessDebug } from './showMasaiversePage'

export const getMasaiverseAccessDebugServer = createServerFn({
  method: 'GET',
}).handler(async (): Promise<MasaiverseAccessDebug> => {
  const { getMasaiverseAccessDebug } = await import('./showMasaiversePage')
  const userId = await requireSessionUserId()
  return getMasaiverseAccessDebug(userId)
})
