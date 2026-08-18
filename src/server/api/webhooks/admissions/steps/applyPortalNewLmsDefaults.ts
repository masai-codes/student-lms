import { eq } from 'drizzle-orm'

import { users } from '@/db/schema'
import { logger } from '@/lib/logger'
import {
  HIDE_SWITCH_OPTION_META_KEY,
  NEW_LMS_PAGES_META_KEY,
} from '@/server/api/profile/newLmsPreference.service'
import type {
  DbTransaction,
  EnrolmentClient,
} from '@/server/api/webhooks/admissions/types'

const FN = 'applyPortalNewLmsDefaults'

type Params = {
  userId: number
  /** Logging only — the flags are applied to every client alike. */
  client: EnrolmentClient
}

/**
 * Every student enrolled through the admissions webhook lands on the new LMS:
 * `new_lms_pages_enabled` so the migrated pages (dashboard, learn, detail
 * pages) come from this app, and `hide_switch_option` so neither LMS offers a
 * way back. Applies to all clients — masai, iHub and iitj alike.
 *
 * Runs on every enrolment (create *and* revive), so a user enrolled before this
 * became the default is migrated on their next enrolment. That covers batch
 * transfers too: admissions moves a student by cancelling the old enrolment and
 * creating one on the destination batch, so the create webhook fires again.
 *
 * Both keys are forced to `true` rather than only filled when absent: a student
 * who previously switched back has `new_lms_pages_enabled: false`, and leaving
 * that while setting `hide_switch_option` would strand them on the old LMS with
 * no CTA to return. Read-modify-write preserving every other meta key,
 * mirroring `newLmsPreference.service.ts`.
 */
export async function applyPortalNewLmsDefaults(
  tx: DbTransaction,
  { userId, client }: Params,
): Promise<void> {
  const rows = await tx
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const existingMeta = (
    rows[0]?.meta && typeof rows[0].meta === 'object' ? rows[0].meta : {}
  ) as Record<string, unknown>

  const alreadySet =
    existingMeta[NEW_LMS_PAGES_META_KEY] === true &&
    existingMeta[HIDE_SWITCH_OPTION_META_KEY] === true
  if (alreadySet) return

  const newMeta = {
    ...existingMeta,
    [NEW_LMS_PAGES_META_KEY]: true,
    [HIDE_SWITCH_OPTION_META_KEY]: true,
  }

  await tx
    .update(users)
    .set({ meta: newMeta, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))

  logger.info({
    msg: 'Applied new-LMS defaults to user meta',
    fn: FN,
    userId,
    client,
  })
}
