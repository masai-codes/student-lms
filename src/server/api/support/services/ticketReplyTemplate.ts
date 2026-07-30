/**
 * Support module — the "first template response" auto-reply.
 *
 * Faithful port of the legacy `createTicketV2` initial comment: when a ticket is
 * raised we insert a real, public coordinator comment (NOT a synthetic banner)
 * with a tailored acknowledgement + signature. The signature's display name and
 * phone are resolved from the batch settings + routing track exactly as the
 * legacy `computeReplyDisplayName` / `computeReplyPhoneNumber` (L1 tier).
 */

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { batches, users } from '@/db/schema'
import { trackForCategory } from '@/server/api/support/services/resolveAssignees'

/** Legacy L1 titles (curriculum "discussion" track vs ops track). */
const ASSIGNMENT_TITLE_L1 = 'Curriculum Co-ordinator'
const NON_ASSIGNMENT_FALLBACK_L1 = 'Program Co-ordinator'

function computeDisplayName(input: {
  showAdminName: boolean
  adminName: string | null | undefined
  isAssignmentCategory: boolean
  batchSettings: Record<string, unknown>
}): string {
  if (input.showAdminName) return (input.adminName ?? '').trim()
  if (input.isAssignmentCategory) return ASSIGNMENT_TITLE_L1
  const titles = input.batchSettings.opsRoleTitles as
    | Record<string, string>
    | undefined
  const fromBatch = titles?.l1
  if (fromBatch != null && String(fromBatch).trim() !== '') {
    return String(fromBatch).trim()
  }
  return NON_ASSIGNMENT_FALLBACK_L1
}

async function loadBatchSettings(
  batchId: number | null,
): Promise<Record<string, unknown>> {
  if (!batchId) return {}
  const rows = await db
    .select({ settings: batches.settings })
    .from(batches)
    .where(eq(batches.id, batchId))
  return (rows[0]?.settings as Record<string, unknown> | null) ?? {}
}

async function resolveDisplayName(input: {
  batchSettings: Record<string, unknown>
  category: string
  assigneeId: number
}): Promise<string> {
  const isAssignmentCategory =
    trackForCategory(input.category) === 'discussionPC'

  const showAdminName = input.batchSettings.showAdminNameInTicketReply === true
  let adminName: string | null = null
  if (showAdminName) {
    const rows = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, input.assigneeId))
    adminName = rows[0]?.name ?? null
  }

  return computeDisplayName({
    showAdminName,
    adminName,
    isAssignmentCategory,
    batchSettings: input.batchSettings,
  })
}

/** Legacy L1 display name for the ticket owner (divider + first-reply signature). */
export async function resolveAssigneeDisplayName(input: {
  batchId: number | null
  category: string
  assigneeId: number
}): Promise<string> {
  const batchSettings = await loadBatchSettings(input.batchId)
  return resolveDisplayName({
    batchSettings,
    category: input.category,
    assigneeId: input.assigneeId,
  })
}

function computePhoneNumber(input: {
  isAssignmentCategory: boolean
  batchSettings: Record<string, unknown>
}): string {
  if (input.isAssignmentCategory) return ''
  const phNumbers = input.batchSettings.phNumbers as
    | Record<string, string | null>
    | undefined
  const raw = phNumbers?.ph_l1
  if (raw == null || String(raw).trim() === '') return ''
  return String(raw).trim()
}

/**
 * Build the tailored first-reply comment for a freshly created ticket, or `null`
 * when its body can't be resolved (caller then skips inserting it).
 *
 * @returns `message` (HTML, identical to the legacy comment) + the resolved
 *          `displayName` (stored on `comments.data` for parity).
 */
export async function buildFirstTemplateResponse(input: {
  batchId: number | null
  category: string
  assigneeId: number
}): Promise<{ message: string; displayName: string }> {
  const isAssignmentCategory =
    trackForCategory(input.category) === 'discussionPC'

  const batchSettings = await loadBatchSettings(input.batchId)
  const displayName = await resolveDisplayName({
    batchSettings,
    category: input.category,
    assigneeId: input.assigneeId,
  })
  const phoneNumber = computePhoneNumber({
    isAssignmentCategory,
    batchSettings,
  })

  const signatureParts = ['Regards,', displayName]
  if (phoneNumber) signatureParts.push(phoneNumber)
  signatureParts.push('Student Experience Team')

  // Join blocks with a single `<br/><br/>` and keep the message on one logical
  // line — source newlines after `<br/>` would otherwise become an *extra*
  // break once `remark-breaks` runs in SupportMarkdown.
  const message = [
    'Dear Student,',
    "Thank you for reaching out. You're at the heart of everything we do, and we're here to help.",
    'Our team will get back to you within 48 hours. We appreciate your patience — your query and your time both matter to us.',
    signatureParts.join('<br/>'),
  ].join('<br/><br/>')

  return { message, displayName }
}
