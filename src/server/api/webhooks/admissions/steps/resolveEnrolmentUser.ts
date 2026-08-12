import { hash } from 'bcryptjs'
import { and, eq } from 'drizzle-orm'

import { users } from '@/db/schema'
import { logger } from '@/lib/logger'
import {
  HIDE_SWITCH_OPTION_META_KEY,
  NEW_LMS_PAGES_META_KEY,
} from '@/server/api/profile/newLmsPreference.service'
import type {
  CreateEnrolmentInput,
  DbTransaction,
  EnrolmentClient,
} from '@/server/api/webhooks/admissions/types'

const BCRYPT_COST = 10
const FN = 'resolveEnrolmentUser'

/**
 * Every student created here starts on the new LMS with no way back: the new
 * pages come from this app and neither LMS offers a switch. Applies to all
 * clients — `applyPortalNewLmsDefaults` still backfills *existing* iitj users.
 */
const NEW_STUDENT_META = {
  [NEW_LMS_PAGES_META_KEY]: true,
  [HIDE_SWITCH_OPTION_META_KEY]: true,
} as const

/**
 * Find the student for this enrolment by the `(email, client)` pair. If one
 * already exists we reuse it untouched; otherwise we create a fresh `student`
 * user with a bcrypt-hashed password and the new-LMS-only meta flags. Returns
 * the resolved user id.
 */
export async function resolveEnrolmentUser(
  tx: DbTransaction,
  input: CreateEnrolmentInput,
  client: EnrolmentClient,
): Promise<number> {
  const existing = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, input.email), eq(users.client, client)))
    .limit(1)

  const existingUser = existing.at(0)
  if (existingUser) {
    logger.info({
      msg: 'Reusing existing user for enrolment',
      fn: FN,
      userId: existingUser.id,
      client,
    })
    return existingUser.id
  }

  const hashedPassword = await hash(input.password, BCRYPT_COST)
  const now = new Date().toISOString()
  // `username` is intentionally not stored on `users` — it lives on `batch_user`
  // (set in reviveOrCreateBatchUser) to avoid duplicating it here.
  const [result] = await tx.insert(users).values({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    mobile: input.mobile,
    role: 'student',
    client,
    meta: { ...NEW_STUDENT_META },
    createdAt: now,
    updatedAt: now,
  })

  const userId = Number(result.insertId)
  logger.info({
    msg: 'Created new user for enrolment',
    fn: FN,
    userId,
    client,
  })
  return userId
}
