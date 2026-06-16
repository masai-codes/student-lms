/**
 * Support module — "directory" services: who the student is, where they can get
 * help, and whether they're allowed to raise a ticket.
 *
 *   1. {@link getUserSupportBatches} — the student's active batches (support scope).
 *   2. {@link getSupportGate}         — is ticket creation blocked, and why?
 *   3. {@link getCoordinators}        — IA / EC / PC for 1:1 help.
 *   4. {@link getBatchContact}        — batch support line + phone.
 *
 * These are intentionally small and independent so the overview orchestrator can
 * fan them out in parallel.
 */

import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import type {
  SupportBatch,
  SupportCoordinator,
  SupportGateReason,
} from '@/server/api/support/support.types'
import { db } from '@/db'
import { batches, sectionUser, sections, users } from '@/db/schema'
import { checkAgreementRequired } from '@/server/api/dashboard/getDashboardActionBanners.service'

/**
 * The student's batches — **derived from their section enrollments**, exactly
 * like the legacy `getUserBatchesWithShowBatchDetails`: every batch the user has
 * a `section_user` row for, de-duplicated, ordered by latest enrollment
 * (`section_user.id` desc). No `active`/`isActive` filtering — that's what the
 * original does, and filtering it down was hiding batches.
 *
 * The first returned batch is the default support scope. `oneOnOneEnabled` reads
 * `batches.settings.show_pp`.
 */
export async function getUserSupportBatches(
  userId: number,
): Promise<Array<SupportBatch>> {
  // 1) The user's sections → batch ids, newest enrollment first.
  const enrollments = await db
    .select({ batchId: sections.batchId })
    .from(sectionUser)
    .innerJoin(sections, eq(sections.id, sectionUser.sectionId))
    .where(eq(sectionUser.userId, userId))
    .orderBy(desc(sectionUser.id))

  // 2) Unique, order-preserving list of batch ids.
  const orderedBatchIds: Array<number> = []
  const seen = new Set<number>()
  for (const e of enrollments) {
    if (!seen.has(e.batchId)) {
      seen.add(e.batchId)
      orderedBatchIds.push(e.batchId)
    }
  }
  if (orderedBatchIds.length === 0) return []

  // 3) Fetch batch details and return them in enrollment order.
  const rows = await db
    .select({ id: batches.id, name: batches.name, settings: batches.settings })
    .from(batches)
    .where(inArray(batches.id, orderedBatchIds))

  const byId = new Map(rows.map((r) => [r.id, r]))
  return orderedBatchIds
    .map((id) => byId.get(id))
    .filter((b): b is (typeof rows)[number] => Boolean(b))
    .map((b) => ({
      id: b.id,
      name: b.name,
      oneOnOneEnabled: Boolean(b.settings?.show_pp),
    }))
}

/**
 * Decide whether ticket creation is blocked, in legacy precedence order:
 *   1. **legal-agreement** — the student has a mandatory, unsigned agreement
 *      (reuses the dashboard's `checkAgreementRequired`, so the rule stays in one
 *      place and matches the agreement banner shown elsewhere).
 *   2. **no-active-section** — no active, non-deleted section in the batch
 *      (mirrors the legacy `getSectionsForTicket` gate).
 */
export async function getSupportGate(input: {
  userId: number
  batchId: number
}): Promise<SupportGateReason> {
  // 1) Mandatory unsigned agreement blocks everything (same as the dashboard).
  const pendingAgreements = await checkAgreementRequired(input.userId)
  if (pendingAgreements.length > 0) return 'legal-agreement'

  const activeSections = await db
    .select({ id: sectionUser.id })
    .from(sectionUser)
    .innerJoin(sections, eq(sections.id, sectionUser.sectionId))
    .where(
      and(
        eq(sectionUser.userId, input.userId),
        eq(sections.batchId, input.batchId),
        eq(sections.active, 1),
        isNull(sectionUser.deletedAt),
        isNull(sections.deletedAt),
      ),
    )
    .limit(1)

  return activeSections.length === 0 ? 'no-active-section' : null
}

/** Maps a raw `section_user.role` to the coordinator kind shown in the UI. */
function coordinatorKind(role: string | null): SupportCoordinator['kind'] | null {
  const r = (role ?? '').toUpperCase()
  if (r.includes('IA') || r.includes('INSTRUCTOR')) return 'IA'
  if (r.includes('EC') || r.includes('EDUCATION')) return 'EC'
  if (r.includes('PC') || r.includes('PROGRAM')) return 'PC'
  return null
}

/**
 * The coordinators (IA / EC / PC) attached to the student's active sections in
 * a batch, for 1:1 booking. Returns `[]` when the batch hasn't enabled 1:1 or
 * none are configured — the UI then hides the section entirely.
 *
 * The Calendly link, if any, is read from `users.meta.calendly`.
 */
export async function getCoordinators(input: {
  userId: number
  batchId: number
}): Promise<Array<SupportCoordinator>> {
  // Find the student's active sections in this batch.
  const studentSections = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .innerJoin(sections, eq(sections.id, sectionUser.sectionId))
    .where(
      and(
        eq(sectionUser.userId, input.userId),
        eq(sections.batchId, input.batchId),
        eq(sections.active, 1),
        isNull(sectionUser.deletedAt),
      ),
    )

  const sectionIds = studentSections.map((s) => s.sectionId)
  if (sectionIds.length === 0) return []

  // Coordinators are the non-student members of those sections.
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      role: sectionUser.role,
      profilePhotoPath: users.profilePhotoPath,
      meta: users.meta,
    })
    .from(sectionUser)
    .innerJoin(users, eq(users.id, sectionUser.userId))
    .where(
      and(
        inArray(sectionUser.sectionId, sectionIds),
        isNull(sectionUser.deletedAt),
      ),
    )

  const seen = new Set<number>()
  const coordinators: Array<SupportCoordinator> = []
  for (const r of rows) {
    const kind = coordinatorKind(r.role)
    if (!kind || seen.has(r.id)) continue
    seen.add(r.id)
    const meta = (r.meta as Record<string, any> | null) ?? {}
    coordinators.push({
      id: r.id,
      name: r.name,
      kind,
      role: r.role,
      profilePhotoPath: r.profilePhotoPath ?? null,
      calendlyUrl: typeof meta.calendly === 'string' ? meta.calendly : null,
    })
  }
  return coordinators
}

/** Support contact line + phone for a batch (from `batches.settings`). */
export async function getBatchContact(
  batchId: number,
): Promise<{ text: string | null; phone: string | null }> {
  const rows = await db
    .select({ settings: batches.settings })
    .from(batches)
    .where(eq(batches.id, batchId))

  const settings = (rows.length > 0 ? rows[0].settings : null) ?? {}
  return {
    text: typeof settings.supportText === 'string' ? settings.supportText : null,
    phone:
      typeof settings.supportMobileNumber === 'string'
        ? settings.supportMobileNumber
        : null,
  }
}
