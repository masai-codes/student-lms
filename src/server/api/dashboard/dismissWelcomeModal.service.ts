import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function dismissWelcomeModal(userId: number): Promise<void> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const existing = rows.at(0)
  if (!existing) return

  const meta = (existing.meta ?? {}) as Record<string, unknown>
  if (meta.showWelcomeModal === true) return

  await db
    .update(users)
    .set({ meta: { ...meta, showWelcomeModal: true } })
    .where(eq(users.id, userId))
}
