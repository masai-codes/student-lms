export type DeviceType = 'ios' | 'android' | 'web'

export type RegisterTokenParams = {
  userId: number
  token: string
  deviceType?: DeviceType
  deviceName?: string
}

export type RemoveTokenParams = {
  userId: number
  token: string
}

export type UserDeviceTokenDto = {
  id: number
  userId: number
  token: string
  deviceType: string | null
  deviceName: string | null
  active: boolean
  lastUsed: string | null
  createdAt: string
  updatedAt: string
}

export type RegisterDeviceTokenResponse = {
  success: boolean
  message: string
  data?: UserDeviceTokenDto
}

export type RemoveDeviceTokenResponse = {
  success: boolean
  message: string
}

export type GetUserDevicesResponse = {
  success: boolean
  data: Array<UserDeviceTokenDto>
}

export type SendNotificationWithLoggingParams = {
  userId: number
  title: string
  body: string
  notificationType: string
  entityType: string
  entityId: number
  data?: Record<string, string>
}

export type SendNotificationWithLoggingResponse = {
  success: boolean
  message: string
  notificationLogId?: number
}
