import { and, desc, eq, inArray, lt, ne } from 'drizzle-orm'
import { Expo } from 'expo-server-sdk'
import type { ExpoPushTicket } from 'expo-server-sdk'
import type {
  GetUserDevicesResponse,
  RegisterDeviceTokenResponse,
  RegisterTokenParams,
  RemoveDeviceTokenResponse,
  RemoveTokenParams,
  SendNotificationWithLoggingParams,
  SendNotificationWithLoggingResponse,
  UserDeviceTokenDto,
} from './types'
import { db } from '@/db'
import { notificationLogs, userDeviceTokens } from '@/db/schema'

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
})
const TEST_EXPO_PUSH_TOKEN = 'ExponentPushToken[q3G1K-EhoFVLg7ueCm4y0E]'

function mapDeviceTokenRowToDto(row: typeof userDeviceTokens.$inferSelect): UserDeviceTokenDto {
  return {
    id: row.id,
    userId: row.userId,
    token: row.token,
    deviceType: row.deviceType,
    deviceName: row.deviceName,
    active: row.active === 1,
    lastUsed: row.lastUsed,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PushNotificationService {
  private isValidExpoPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token)
  }

  async registerDeviceToken(params: RegisterTokenParams): Promise<RegisterDeviceTokenResponse> {
    try {
      const { userId, token, deviceType, deviceName } = params

      if (!this.isValidExpoPushToken(token)) {
        return {
          success: false,
          message: 'Invalid Expo push token format',
        }
      }

      const tokensForOtherUsers = await db
        .select()
        .from(userDeviceTokens)
        .where(
          and(
            eq(userDeviceTokens.token, token),
            ne(userDeviceTokens.userId, userId),
            eq(userDeviceTokens.active, 1),
          ),
        )

      if (tokensForOtherUsers.length > 0) {
        await db
          .update(userDeviceTokens)
          .set({
            active: 0,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          })
          .where(and(eq(userDeviceTokens.token, token), ne(userDeviceTokens.userId, userId)))
      }

      const existingTokenRows = await db
        .select()
        .from(userDeviceTokens)
        .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.token, token)))
      if (existingTokenRows.length > 0) {
        const existingToken = existingTokenRows[0]

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
        await db
          .update(userDeviceTokens)
          .set({
            active: 1,
            lastUsed: now,
            deviceType: deviceType ?? null,
            deviceName: deviceName ?? null,
            updatedAt: now,
          })
          .where(eq(userDeviceTokens.id, existingToken.id))

        return {
          success: true,
          message: 'Device token updated successfully',
          data: mapDeviceTokenRowToDto({
            ...existingToken,
            active: 1,
            lastUsed: now,
            deviceType: deviceType ?? null,
            deviceName: deviceName ?? null,
            updatedAt: now,
          }),
        }
      }

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      await db.insert(userDeviceTokens).values({
        userId,
        token,
        deviceType: deviceType ?? null,
        deviceName: deviceName ?? null,
        active: 1,
        lastUsed: now,
        updatedAt: now,
      })

      const createdTokenRows = await db
        .select()
        .from(userDeviceTokens)
        .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.token, token)))
      const createdToken = createdTokenRows[0]

      return {
        success: true,
        message: 'Device token registered successfully',
        data: mapDeviceTokenRowToDto(createdToken),
      }
    } catch {
      return {
        success: false,
        message: 'Failed to register device token',
      }
    }
  }

  async removeDeviceToken(params: RemoveTokenParams): Promise<RemoveDeviceTokenResponse> {
    try {
      const { userId, token } = params
      const existingTokenRows = await db
        .select()
        .from(userDeviceTokens)
        .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.token, token)))
      if (existingTokenRows.length === 0) {
        return {
          success: false,
          message: 'Device token not found',
        }
      }
      const existingToken = existingTokenRows[0]

      await db
        .update(userDeviceTokens)
        .set({
          active: 0,
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(userDeviceTokens.id, existingToken.id))

      return {
        success: true,
        message: 'Device token removed successfully',
      }
    } catch {
      return {
        success: false,
        message: 'Failed to remove device token',
      }
    }
  }

  async getUserDevices(userId: number): Promise<GetUserDevicesResponse> {
    try {
      const devices = await db
        .select()
        .from(userDeviceTokens)
        .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.active, 1)))
        .orderBy(desc(userDeviceTokens.lastUsed))

      return {
        success: true,
        data: devices.map(mapDeviceTokenRowToDto),
      }
    } catch {
      return {
        success: true,
        data: [],
      }
    }
  }

  async getActiveTokensForUser(userId: number): Promise<Array<string>> {
    try {
      const devices = await db
        .select({ token: userDeviceTokens.token })
        .from(userDeviceTokens)
        .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.active, 1)))

      const dbTokens = devices.map((device) => device.token)
      // Temporary hardcoded token for manual testing.
      return Array.from(new Set([...dbTokens, TEST_EXPO_PUSH_TOKEN]))
    } catch {
      return [TEST_EXPO_PUSH_TOKEN]
    }
  }

  async markInactiveTokens(daysInactive = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive)
      const cutoff = cutoffDate.toISOString().slice(0, 19).replace('T', ' ')
      const staleTokens = await db
        .select({ id: userDeviceTokens.id })
        .from(userDeviceTokens)
        .where(and(eq(userDeviceTokens.active, 1), lt(userDeviceTokens.lastUsed, cutoff)))

      if (staleTokens.length === 0) {
        return 0
      }

      await db
        .update(userDeviceTokens)
        .set({
          active: 0,
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(and(eq(userDeviceTokens.active, 1), lt(userDeviceTokens.lastUsed, cutoff)))

      return staleTokens.length
    } catch {
      return 0
    }
  }

  async sendNotificationWithLogging(
    params: SendNotificationWithLoggingParams,
  ): Promise<SendNotificationWithLoggingResponse> {
    const { userId, title, body, notificationType, entityType, entityId, data } = params

    try {
      const tokens = await this.getActiveTokensForUser(userId)
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

      await db.insert(notificationLogs).values({
        userId,
        notificationType,
        entityType,
        entityId,
        title,
        body,
        data: data || {},
        status: tokens.length > 0 ? 'pending' : 'failed',
        errorMessage: tokens.length === 0 ? 'No active devices registered' : null,
        updatedAt: now,
      })

      const notificationLogRows = await db
        .select({ id: notificationLogs.id })
        .from(notificationLogs)
        .where(
          and(
            eq(notificationLogs.userId, userId),
            eq(notificationLogs.notificationType, notificationType),
            eq(notificationLogs.entityId, entityId),
          ),
        )
        .orderBy(desc(notificationLogs.id))
      if (notificationLogRows.length === 0) {
        return {
          success: false,
          message: 'Failed to create notification log',
        }
      }
      const notificationLog = notificationLogRows[0]

      if (tokens.length === 0) {
        return {
          success: false,
          message: 'No active devices registered for this user',
          notificationLogId: notificationLog.id,
        }
      }

      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default' as const,
        title,
        body,
        data: data || {},
      }))

      const chunks = expo.chunkPushNotifications(messages)
      const results: Array<ExpoPushTicket> = []
      let hasSuccess = false

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
          results.push(...ticketChunk)
          if (ticketChunk.some((ticket) => ticket.status === 'ok')) {
            hasSuccess = true
          }
        } catch {
          // continue with remaining chunks
        }
      }

      const failedTokens: Array<string> = []
      results.forEach((ticket, index) => {
        const token = tokens[index]
        if (
          token &&
          ticket.status === 'error' &&
          (ticket.details?.error === 'DeviceNotRegistered' ||
            ticket.details?.error === 'InvalidCredentials')
        ) {
          failedTokens.push(token)
        }
      })

      if (failedTokens.length > 0) {
        await db
          .update(userDeviceTokens)
          .set({
            active: 0,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          })
          .where(and(eq(userDeviceTokens.userId, userId), inArray(userDeviceTokens.token, failedTokens)))
      }

      const successCount = results.filter((ticket) => ticket.status === 'ok').length
      const finalStatus = hasSuccess ? 'sent' : 'failed'

      await db
        .update(notificationLogs)
        .set({
          status: finalStatus,
          sentAt: hasSuccess ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
          errorMessage: hasSuccess ? null : 'Failed to send notification to any active device',
          updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(notificationLogs.id, notificationLog.id))

      return {
        success: hasSuccess,
        message: hasSuccess
          ? `Notification sent to ${successCount} device(s)`
          : 'Failed to send notification to any device',
        notificationLogId: notificationLog.id,
      }
    } catch {
      return {
        success: false,
        message: 'Failed to send notification',
      }
    }
  }

  async sendNotificationToUser(params: {
    userId: number
    title: string
    body: string
    data?: Record<string, string>
  }): Promise<{ success: boolean; message: string; results?: Array<ExpoPushTicket> }> {
    try {
      const { userId, title, body, data } = params
      const tokens = await this.getActiveTokensForUser(userId)

      if (tokens.length === 0) {
        return {
          success: false,
          message: 'No active devices registered for this user',
        }
      }

      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default' as const,
        title,
        body,
        data: data || {},
      }))

      const chunks = expo.chunkPushNotifications(messages)
      const results: Array<ExpoPushTicket> = []

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
          results.push(...ticketChunk)
        } catch {
          // continue with remaining chunks
        }
      }

      const failedTokens: Array<string> = []
      results.forEach((ticket, index) => {
        const token = tokens[index]
        if (
          token &&
          ticket.status === 'error' &&
          (ticket.details?.error === 'DeviceNotRegistered' ||
            ticket.details?.error === 'InvalidCredentials')
        ) {
          failedTokens.push(token)
        }
      })

      if (failedTokens.length > 0) {
        await db
          .update(userDeviceTokens)
          .set({
            active: 0,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          })
          .where(and(eq(userDeviceTokens.userId, userId), inArray(userDeviceTokens.token, failedTokens)))
      }

      const successCount = results.filter((ticket) => ticket.status === 'ok').length
      return {
        success: successCount > 0,
        message:
          successCount > 0
            ? `Notification sent to ${successCount} device(s)`
            : 'Failed to send notification to any device',
        results,
      }
    } catch {
      return {
        success: false,
        message: 'Failed to send notification',
      }
    }
  }
}

export const pushNotificationService = new PushNotificationService()
