import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

/**
 * Key on `users.meta` recording whether the user opted in to receiving the
 * migrated pages (dashboard, learn, lecture/assignment/resource detail) from
 * the new LMS. Absent = opted out (default). Shared with the old LMS +
 * experience-api, which read/write the same key.
 */
export const NEW_LMS_PAGES_META_KEY = 'new_lms_pages_enabled'

/**
 * Key on `users.meta` that hides the old↔new "switch" CTA entirely — in this app
 * *and* in the old LMS, which reads the same key off the `me` payload's `meta`.
 * Set for IIT Jodhpur enrolments (see `applyPortalNewLmsDefaults`), who ship
 * straight onto the new LMS with no way back. Absent = switch visible (default).
 */
export const HIDE_SWITCH_OPTION_META_KEY = 'hide_switch_option'

/**
 * Key on `users.meta` holding the history of "switched back to old LMS" events.
 * An array so every switch-back (with its optional feedback) is preserved.
 */
export const NEW_LMS_SWITCH_FEEDBACK_META_KEY = 'new_lms_switch_feedback'

export interface NewLmsSwitchFeedbackEntry {
  feedback: string
  createdAt: string
}

/**
 * Key on `users.meta` recording that the user has seen the one-time "Try New"
 * guided tour. Once true the tour never shows again (lifetime, per user).
 */
export const NEW_LMS_TRY_NEW_TOUR_META_KEY = 'new_lms_try_new_tour_seen'

function readFlag(meta: unknown): boolean {
  if (!meta || typeof meta !== 'object') return false
  return (meta as Record<string, unknown>)[NEW_LMS_PAGES_META_KEY] === true
}

/** Whether the switch CTA is hidden for this user (see the meta key's doc). */
function readHideSwitch(meta: unknown): boolean {
  if (!meta || typeof meta !== 'object') return false
  return (meta as Record<string, unknown>)[HIDE_SWITCH_OPTION_META_KEY] === true
}

function readFeedbackList(meta: unknown): Array<NewLmsSwitchFeedbackEntry> {
  if (!meta || typeof meta !== 'object') return []
  const list = (meta as Record<string, unknown>)[
    NEW_LMS_SWITCH_FEEDBACK_META_KEY
  ]
  return Array.isArray(list) ? (list as Array<NewLmsSwitchFeedbackEntry>) : []
}

/** Reads the new-LMS-pages opt-in flag from users.meta. Defaults to false. */
export async function getNewLmsPagesPreference(
  userId: number,
): Promise<boolean> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return readFlag(rows[0]?.meta)
}

/**
 * Sets the flag, preserving every other key already on users.meta.
 * Read-modify-write, mirroring emailPreferences.service.ts.
 *
 * When the user switches back (true → false), appends an entry to the
 * `new_lms_switch_feedback` array with the optional feedback text, so all
 * switch-backs are preserved across multiple toggles.
 *
 * No-op when `hide_switch_option` is set: those users have no switch CTA in
 * either LMS, so any call here is a hand-crafted request and must not move them
 * off the new LMS. Returns their current (unchanged) value.
 */
export async function updateNewLmsPagesPreference(
  userId: number,
  enabled: boolean,
  feedback?: string,
): Promise<boolean> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const existingMeta = (
    rows[0]?.meta && typeof rows[0].meta === 'object' ? rows[0].meta : {}
  ) as Record<string, unknown>

  const wasEnabled = readFlag(existingMeta)
  if (readHideSwitch(existingMeta)) return wasEnabled

  const newMeta: Record<string, unknown> = {
    ...existingMeta,
    [NEW_LMS_PAGES_META_KEY]: enabled,
  }

  // Record a switch-back event only on an actual ON → OFF transition.
  if (wasEnabled && !enabled) {
    const entry: NewLmsSwitchFeedbackEntry = {
      feedback: (feedback ?? '').trim(),
      createdAt: new Date().toISOString(),
    }
    newMeta[NEW_LMS_SWITCH_FEEDBACK_META_KEY] = [
      ...readFeedbackList(existingMeta),
      entry,
    ]
  }

  await db
    .update(users)
    .set({
      meta: newMeta,
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    })
    .where(eq(users.id, userId))

  return enabled
}

/** Marks the one-time "Try New" guided tour as seen, preserving other meta keys. */
export async function markTryNewTourSeen(userId: number): Promise<boolean> {
  const rows = await db
    .select({ meta: users.meta })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const existingMeta = (
    rows[0]?.meta && typeof rows[0].meta === 'object' ? rows[0].meta : {}
  ) as Record<string, unknown>

  const newMeta = { ...existingMeta, [NEW_LMS_TRY_NEW_TOUR_META_KEY]: true }

  await db
    .update(users)
    .set({
      meta: newMeta,
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    })
    .where(eq(users.id, userId))

  return true
}
