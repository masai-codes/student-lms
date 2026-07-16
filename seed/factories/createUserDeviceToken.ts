import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { userDeviceTokens } from '@/db/schema'

import { formatMysqlDatetime, offsetFromNow } from '../utils/time'

type DeviceTokenInsert = typeof userDeviceTokens.$inferInsert
type DeviceTokenSelect = typeof userDeviceTokens.$inferSelect

export type CreateUserDeviceTokenOverrides = Partial<
  Omit<DeviceTokenInsert, 'id'>
>

export async function createUserDeviceToken(
  overrides: CreateUserDeviceTokenOverrides = {},
): Promise<DeviceTokenSelect> {
  const { userId, token } = overrides
  if (userId == null || !token) {
    throw new Error('createUserDeviceToken requires userId and token')
  }

  const now = formatMysqlDatetime(offsetFromNow({ minutesAgo: 0 }))
  const values: DeviceTokenInsert = {
    active: 1,
    updatedAt: now,
    ...overrides,
    userId,
    token,
  }

  const [result] = await db.insert(userDeviceTokens).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(userDeviceTokens)
    .where(eq(userDeviceTokens.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load device token after insert (id=${id})`)
  }

  return row
}
