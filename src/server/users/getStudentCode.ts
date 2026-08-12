import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { batchUser } from '@/db/schema'

/**
 * A student code as recorded on one batch enrolment.
 */
export interface StudentCode {
  code: string
  batchId: number
}

/**
 * The student code for one batch enrolment — the ONLY source of truth for a student
 * code. `users.username` is stale (and null for most newer users) and a learner in two
 * batches has a different code in each, so never read it: anything batch-scoped
 * (agreements, certificates, assess/admissions payloads) must resolve the code here.
 *
 * Returns `null` when the enrolment carries no username.
 */
export async function getStudentCodeForBatch(
  userId: number,
  batchId: number,
): Promise<string | null> {
  const rows = await db
    .select({ username: batchUser.username })
    .from(batchUser)
    .where(
      and(
        eq(batchUser.userId, userId),
        eq(batchUser.batchId, batchId),
        isNull(batchUser.deletedAt),
        isNotNull(batchUser.username),
      ),
    )
    .orderBy(desc(batchUser.createdAt))
    .limit(1)

  return rows.at(0)?.username?.trim() || null
}

/**
 * Every student code the user has, most recent enrolment first. Use when no single
 * batch is in scope (e.g. a cross-batch login payload) — prefer
 * {@link getStudentCodeForBatch} whenever a batch is known.
 */
export async function getStudentCodesForUser(
  userId: number,
): Promise<Array<StudentCode>> {
  const rows = await db
    .select({ username: batchUser.username, batchId: batchUser.batchId })
    .from(batchUser)
    .where(
      and(
        eq(batchUser.userId, userId),
        isNull(batchUser.deletedAt),
        isNotNull(batchUser.username),
      ),
    )
    .orderBy(desc(batchUser.createdAt))

  const seen = new Set<string>()
  const codes: Array<StudentCode> = []
  for (const row of rows) {
    const code = row.username?.trim()
    if (!code || seen.has(code)) continue
    seen.add(code)
    codes.push({ code, batchId: row.batchId })
  }
  return codes
}

/**
 * Best-effort student code: the code on `batchId` when the user has one there,
 * otherwise their most recent code from any batch. Empty string when they have none,
 * so callers can drop it straight into a payload.
 */
export async function resolveStudentCode(
  userId: number,
  batchId?: number | null,
): Promise<string> {
  if (batchId != null) {
    const scoped = await getStudentCodeForBatch(userId, batchId)
    if (scoped) return scoped
  }

  const codes = await getStudentCodesForUser(userId)
  return codes.at(0)?.code ?? ''
}
