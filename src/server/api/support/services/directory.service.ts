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
  OneOnOneBatchGroup,
  OneOnOneSection,
  SupportBatch,
  SupportCoordinator,
  SupportGateReason,
} from '@/server/api/support/support.types'
import { db } from '@/db'
import { batches, profiles, sectionUser, sections, users } from '@/db/schema'

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

/** True if a configured agreement sub-key (heading + pdfUrl, not hidden) exists. */
function hasConfiguredAgreement(agreements: Record<string, any>): boolean {
  return Object.entries(agreements).some(([key, val]) => {
    if (key === 'shouldModalBeVisible') return false
    const e = val as Record<string, any> | null
    return (
      !!e &&
      typeof e.heading === 'string' && e.heading.trim() !== '' &&
      typeof e.pdfUrl === 'string' && e.pdfUrl.trim() !== '' &&
      e.hidePolicy !== true && e.hidePolicy !== 'true'
    )
  })
}

/**
 * Whether a mandatory agreement currently **blocks** ticket creation — faithful
 * to the legacy `getLegalAgreementData` + support gate:
 *
 *   blocked ⇔ some active section with a configured, modal-enabled agreement
 *             where the modal is **non-closable** and **not accepted**, i.e.
 *             `viewTime` exists AND `daysSinceFirstView >= 7` AND not accepted.
 *
 * Crucially it does NOT block during the 7-day grace window (or before first
 * view) — which is why most students never see "Access Restricted".
 */
async function isLegalAgreementBlocking(userId: number): Promise<boolean> {
  const rows = await db
    .select({ sectionId: sections.id, settings: sections.settings })
    .from(sectionUser)
    .innerJoin(sections, eq(sections.id, sectionUser.sectionId))
    .where(
      and(
        eq(sectionUser.userId, userId),
        eq(sections.active, 1),
        isNull(sectionUser.deletedAt),
      ),
    )

  const enabled = rows.filter((r) => {
    const s = (r.settings as Record<string, any> | null) ?? {}
    const agreements = (s.agreements ?? {}) as Record<string, any>
    return agreements.shouldModalBeVisible === true && hasConfiguredAgreement(agreements)
  })
  if (enabled.length === 0) return false

  const profileRows = await db
    .select({ legalData: profiles.legalData })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1)

  const legalData = ((profileRows.length > 0 ? profileRows[0].legalData : null) ??
    {}) as Record<string, any>
  const agreementsBySection = (legalData.agreements ?? {}) as Record<string, any>
  const nowMs = Date.now()

  return enabled.some((sec) => {
    const data = (agreementsBySection[`section_${sec.sectionId}`] ?? {}) as Record<string, any>
    if (data.haveAcceptedLegalAgreement === true) return false
    if (!data.viewTime) return false // not yet viewed → modal still closable → not blocking
    const daysSince = Math.floor((nowMs - new Date(data.viewTime).getTime()) / 86_400_000)
    const isModalClosable = daysSince < 7
    return !isModalClosable // blocked only once the 7-day window has passed
  })
}

/**
 * Decide whether ticket creation is blocked, in legacy precedence order:
 *   1. **legal-agreement** — a mandatory agreement modal has become
 *      non-closable (7+ days since first view) and isn't accepted (see
 *      {@link isLegalAgreementBlocking}). Does NOT trigger during the grace
 *      window — matching the original.
 *   2. **no-active-section** — no active, non-deleted section in the batch
 *      (mirrors the legacy `getSectionsForTicket` gate).
 */
export async function getSupportGate(input: {
  userId: number
  batchId: number
}): Promise<SupportGateReason> {
  if (await isLegalAgreementBlocking(input.userId)) return 'legal-agreement'

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

/** Normalise a pp link: trim and prepend https:// when no protocol present. */
function normalizePpLink(value: unknown): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/**
 * The student's 1:1 ("pair programming") support, **grouped by batch** — the
 * legacy layout (batches → sections) with a booking link at both levels:
 *   - batch level: `batches.meta.ppLink`
 *   - section level: `sections.settings.ppLink` (only for active sections with
 *     `show_pp === true`), plus IA (`section_user.manager_id`) + EC/PC
 *     (`role='ec'/'pc'`).
 *
 * Returns `[]` when no section qualifies — the UI then hides the 1:1 tab.
 */
export async function getOneOnOneGroups(
  userId: number,
): Promise<Array<OneOnOneBatchGroup>> {
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

  // Build a section entry (with coordinators) for each qualifying section.
  const sectionEntries = enabled.map((sec) => {
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

    const entry: OneOnOneSection = {
      sectionId: sec.sectionId,
      sectionName: sec.sectionName,
      ppLink: normalizePpLink(sec.ppLink) ?? sec.ppLink,
      coordinators,
    }
    return { batchId: sec.batchId, entry }
  })

  // 4) Batch names + batch-level pp link (batches.meta.ppLink).
  const batchIds = [...new Set(sectionEntries.map((s) => s.batchId))]
  const batchRows = await db
    .select({ id: batches.id, name: batches.name, meta: batches.meta })
    .from(batches)
    .where(inArray(batches.id, batchIds))
  const batchById = new Map(batchRows.map((b) => [b.id, b]))

  // 5) Group sections by batch.
  const groups = new Map<number, OneOnOneBatchGroup>()
  for (const { batchId, entry } of sectionEntries) {
    if (!groups.has(batchId)) {
      const b = batchById.get(batchId)
      groups.set(batchId, {
        batchId,
        batchName: b?.name ?? `Batch ${batchId}`,
        batchPpLink: normalizePpLink(b?.meta?.ppLink),
        sections: [],
      })
    }
    groups.get(batchId)!.sections.push(entry)
  }

  return Array.from(groups.values())
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
