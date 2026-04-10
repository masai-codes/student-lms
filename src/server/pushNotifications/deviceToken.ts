import { createServerFn } from '@tanstack/react-start'
import { pushNotificationService } from './pushNotification.service'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

export const registerDeviceToken = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { token: string; deviceType?: 'ios' | 'android' | 'web'; deviceName?: string }) => data,
  )
  .handler(async ({ data }) => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    return pushNotificationService.registerDeviceToken({
      userId,
      token: data.token,
      deviceType: data.deviceType,
      deviceName: data.deviceName,
    })
  })

export const removeDeviceToken = createServerFn({ method: 'POST' })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    return pushNotificationService.removeDeviceToken({
      userId,
      token: data.token,
    })
  })

export const fetchUserDevices = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  return pushNotificationService.getUserDevices(userId)
})
