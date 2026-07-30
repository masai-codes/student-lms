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
  client: EnrolmentClient
}

/** Portals whose students live on the new LMS with no switch back to the old one. */
const NEW_LMS_ONLY_CLIENTS: ReadonlySet<EnrolmentClient> = new Set(['iitj'])

/**
 * IIT Jodhpur students are new-LMS-only: they get `new_lms_pages_enabled` so the
 * migrated pages come from this app, and `hide_switch_option` so neither LMS
 * offers a way back. Runs on every iitj enrolment (create *and* revive), so a
 * user enrolled before the flags existed is backfilled on their next enrolment.
 *
 * Only ever *fills in* absent keys — a value already on `users.meta` is left
 * alone, so a deliberate override (support unblocking one student) survives a
 * re-enrolment. Read-modify-write preserving every other meta key, mirroring
 * `newLmsPreference.service.ts`. No-op for masai / iHub.
 */
export async function applyPortalNewLmsDefaults(
  tx: DbTransaction,
  { userId, client }: Params,
): Promise<void> {
  if (!NEW_LMS_ONLY_CLIENTS.has(client)) return

  const rows = await tx
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const existingMeta = (
    rows[0]?.meta && typeof rows[0].meta === 'object' ? rows[0].meta : {}
  ) as Record<string, unknown>

  const missingKeys = [NEW_LMS_PAGES_META_KEY, HIDE_SWITCH_OPTION_META_KEY].filter(
    (key) => existingMeta[key] === undefined,
  )
  if (missingKeys.length === 0) return

  const newMeta = { ...existingMeta }
  for (const key of missingKeys) newMeta[key] = true

  await tx
    .update(users)
    .set({ meta: newMeta, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId))

  logger.info({
    msg: 'Applied new-LMS-only defaults to user meta',
    fn: FN,
    userId,
    client,
    keys: missingKeys,
  })
}
