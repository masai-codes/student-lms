import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { users } from '@/db/schema'

import { DEV_PASSWORD_BCRYPT } from '../utils/constants'

type UserInsert = typeof users.$inferInsert
type UserSelect = typeof users.$inferSelect

export type CreateUserOverrides = Partial<Omit<UserInsert, 'id'>>

export async function createUser(
  overrides: CreateUserOverrides = {},
): Promise<UserSelect> {
  const values: UserInsert = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: DEV_PASSWORD_BCRYPT,
    role: 'student',
    status: 'active',
    client: 'masai',
    ...overrides,
  }

  const [result] = await db.insert(users).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load user after insert (id=${id})`)
  }

  return row
}
