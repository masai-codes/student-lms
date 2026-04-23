import { createServerFn } from '@tanstack/react-start'
import type { MasaiverseAccessDebug } from './showMasaiversePage'

export const getMasaiverseAccessDebugServer = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: number }) => data)
  .handler(async ({ data }): Promise<MasaiverseAccessDebug> => {
    const { getMasaiverseAccessDebug } = await import('./showMasaiversePage')
    return getMasaiverseAccessDebug(data.userId)
  })
