/**
 * Support module — escalation ladder resolution.
 *
 * The single most intricate piece of support business logic, ported from the
 * legacy backend. A ticket is owned by an `assignee_id`; that owner sits at a
 * level (L1…L5). Escalation walks the student up the ladder until a Grievance
 * Officer (top) is reached.
 *
 * The ladder for a ticket comes from its **batch settings** JSON, choosing the
 * track by category:
 *
 *   - "assignment" / "evaluation" categories → `settings.discussionPC`
 *   - everything else                        → `settings.opsPC`
 *
 * Each track is `{ l1, l2, l3, l4, l5 }` where each value is a coordinator's
 * `users.id`. (FAQ-level assignees can override this in the legacy system; that
 * hook is documented below but not required for the core flow.)
 */

export type EscalationLevel = 'l1' | 'l2' | 'l3' | 'l4' | 'l5'

export const ESCALATION_ORDER: ReadonlyArray<EscalationLevel> = [
  'l1',
  'l2',
  'l3',
  'l4',
  'l5',
]

/** The five (some optional) coordinator user-ids for one track. */
export type AssigneeLadder = Partial<Record<EscalationLevel, number>>

/** Categories routed through the curriculum ("discussion") track. */
const DISCUSSION_CATEGORIES = new Set(['assignment', 'evaluation'])

/** Pick the discussion vs ops track for a category. */
export function trackForCategory(category: string): 'discussionPC' | 'opsPC' {
  return DISCUSSION_CATEGORIES.has(category.toLowerCase())
    ? 'discussionPC'
    : 'opsPC'
}

/**
 * Read the assignee ladder for a ticket from its batch settings.
 *
 * @param batchSettings The `batches.settings` JSON for the ticket's batch.
 * @param category      The ticket category (selects the track).
 * @returns The `{ l1..l5 }` ladder, or an empty object if unconfigured.
 */
export function ladderFromBatchSettings(
  batchSettings: Record<string, unknown> | null | undefined,
  category: string,
): AssigneeLadder {
  if (!batchSettings) return {}
  const track = trackForCategory(category)
  const raw = batchSettings[track] as Record<string, unknown> | undefined
  if (!raw) return {}

  const ladder: AssigneeLadder = {}
  for (const level of ESCALATION_ORDER) {
    const id = Number(raw[level])
    if (Number.isFinite(id) && id > 0) ladder[level] = id
  }
  return ladder
}

/** The level currently occupied by `assigneeId` within a ladder, if any. */
export function currentLevel(
  ladder: AssigneeLadder,
  assigneeId: number,
): EscalationLevel | null {
  for (const level of ESCALATION_ORDER) {
    if (ladder[level] === assigneeId) return level
  }
  return null
}

/**
 * The next escalation target above the current assignee.
 *
 * @returns `{ level, userId }` of the next-higher configured coordinator, or
 *          `null` when the ticket is already at the top (or the current owner
 *          isn't on the ladder — treated as "no higher level").
 */
export function nextEscalation(
  ladder: AssigneeLadder,
  assigneeId: number,
): { level: EscalationLevel; userId: number } | null {
  const level = currentLevel(ladder, assigneeId)
  // If the current owner isn't on the ladder, start escalation from L1's next.
  const startIndex = level ? ESCALATION_ORDER.indexOf(level) : 0
  for (let i = startIndex + 1; i < ESCALATION_ORDER.length; i++) {
    const next = ESCALATION_ORDER[i]
    const userId = ladder[next]
    if (userId) return { level: next, userId }
  }
  return null
}

/**
 * Whether the ticket can be escalated further — i.e. a higher configured level
 * exists. Drives `TicketCapabilities.canEscalate`.
 */
export function hasHigherLevel(
  batchSettings: Record<string, unknown> | null | undefined,
  category: string,
  assigneeId: number,
): boolean {
  const ladder = ladderFromBatchSettings(batchSettings, category)
  return nextEscalation(ladder, assigneeId) != null
}
