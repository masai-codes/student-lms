import { sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { sections } from '@/db/schema'
import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { getRequestPortal } from '@/server/auth/v2/portalContext'

/**
 * `sections.settings.hideSection` — ops flag that takes a section out of the
 * learner-facing UI (it is still a live section for staff/legacy tooling). Stored
 * as a JSON boolean in the free-form `sections.settings` blob, so the SQL guard
 * compares against a JSON `true` and treats a missing/`false` value as visible.
 *
 * **Honoured on the IIT Jodhpur portal only for now.** Returns `undefined` — a
 * no-op inside `and(...)` — on Masai and iHub, so the flag cannot hide anything
 * there. Drop the portal check to roll it out more widely.
 *
 * Use this in every query that feeds a learner-visible section list (e.g. the
 * `/learn` section dropdown) so a hidden section never appears as an option.
 */
export function sectionNotHiddenCondition(
  portal: EmailPortal = getRequestPortal(),
): SQL | undefined {
  if (portal !== 'iitj') return undefined

  return sql`NOT COALESCE(
    JSON_EXTRACT(${sections.settings}, '$.hideSection') = CAST('true' AS JSON),
    FALSE
  )`
}
