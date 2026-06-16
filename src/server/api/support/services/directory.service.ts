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
  OneOnOneSection,
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

/**
 * The student's 1:1 ("pair programming") sections, mirroring the legacy
 * `getSectionDetailsOfUser`:
 *   - one entry per **active** section the student is in that has
 *     `settings.show_pp === true` **and** a non-empty `settings.ppLink`;
 *   - each carries its IA (the section_user `manager_id`), EC and PC
 *     (the section's `role='ec'`/`'pc'` holders).
 *
 * Returns `[]` when none qualify — the UI then hides the 1:1 tab.
 */
export async function getOneOnOneSections(
  userId: number,
): Promise<Array<OneOnOneSection>> {
  // 1) The student's active sections + their pp settings + IA (manager_id).
  const myRows = await db
    .select({
      sectionId: sections.id,
      sectionName: sections.name,
      batchId: sections.batchId,
      settings: sections.settings,
      managerId: sectionUser.managerId,
    })
    .from(sectionUser)
    .innerJoin(sections, eq(sections.id, sectionUser.sectionId))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.active, 1),
        isNull(sectionUser.deletedAt),
      ),
    )

  // Keep only pp-enabled sections (show_pp + ppLink).
  const enabled = myRows
    .map((r) => {
      const s = (r.settings as Record<string, any> | null) ?? {}
      const ppLink = typeof s.ppLink === 'string' ? s.ppLink.trim() : ''
      return { ...r, showPp: Boolean(s.show_pp), ppLink }
    })
    .filter((r) => r.showPp && r.ppLink !== '')

  if (enabled.length === 0) return []

  const sectionIds = enabled.map((r) => r.sectionId)
  const managerIds = enabled.map((r) => r.managerId).filter((id): id is number => id != null)

  // 2) EC/PC holders for those sections (role is lowercase 'ec'/'pc').
  const ecPcRows = await db
    .select({
      sectionId: sectionUser.sectionId,
      role: sectionUser.role,
      id: users.id,
      name: users.name,
      profilePhotoPath: users.profilePhotoPath,
    })
    .from(sectionUser)
    .innerJoin(users, eq(users.id, sectionUser.userId))
    .where(
      and(
        inArray(sectionUser.sectionId, sectionIds),
        inArray(sectionUser.role, ['ec', 'pc']),
        isNull(sectionUser.deletedAt),
      ),
    )

  // 3) IA users (by manager_id).
  const iaRows = managerIds.length
    ? await db
        .select({ id: users.id, name: users.name, profilePhotoPath: users.profilePhotoPath })
        .from(users)
        .where(inArray(users.id, managerIds))
    : []
  const iaById = new Map(iaRows.map((u) => [u.id, u]))

  return enabled.map((sec) => {
    const coordinators: Array<SupportCoordinator> = []

    const ia = sec.managerId != null ? iaById.get(sec.managerId) : undefined
    if (ia) coordinators.push({ id: ia.id, name: ia.name, kind: 'IA', profilePhotoPath: ia.profilePhotoPath ?? null })

    for (const row of ecPcRows) {
      if (row.sectionId !== sec.sectionId) continue
      coordinators.push({
        id: row.id,
        name: row.name,
        kind: row.role === 'ec' ? 'EC' : 'PC',
        profilePhotoPath: row.profilePhotoPath ?? null,
      })
    }

    return {
      sectionId: sec.sectionId,
      sectionName: sec.sectionName,
      batchId: sec.batchId,
      ppLink: sec.ppLink,
      coordinators,
    }
  })
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
