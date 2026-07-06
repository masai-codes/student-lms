import { eq, sql  } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export interface WelcomeModalStatus {
  showWelcomeModal: boolean
}

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

export async function getWelcomeModalStatus(userId: number): Promise<WelcomeModalStatus> {
  const [admissionRows, userRows] = await Promise.all([
    normalizeRows<{ user_id: number }>(
      await db.execute(sql`
        SELECT user_id FROM user_batch_admission_data
        WHERE user_id = ${userId}
        LIMIT 1
      `)
    ),
    db.select({ meta: users.meta }).from(users).where(eq(users.id, userId)).limit(1),
  ])

  if (admissionRows.length === 0) return { showWelcomeModal: false }

  const meta = (userRows.at(0)?.meta ?? {}) as Record<string, unknown>
  if (meta.showWelcomeModal === true) return { showWelcomeModal: false }

  return { showWelcomeModal: true }
}
