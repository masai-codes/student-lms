import { getPausedCutoff } from '@/server/restrictions/enrollmentRestrictionScope'
import { isScheduledAfterCutoff } from '@/server/restrictions/restrictionDates'
import type {
  LearnDetailRestriction,
  UserBatchRestrictions,
} from '@/server/restrictions/types'

/**
 * Resolves the restriction for a single learn detail page, in decreasing severity:
 *
 * 1. `enrolment-cancelled` — the content's batch enrolment is cancelled (whole page).
 * 2. `paused` — the batch is paused and the item is scheduled after the pause date
 *    (whole page; not applied to pre-pause content).
 * 3. agreement — the batch is agreement-banned AND this content kind is agreement-
 *    restricted (`recording` for a lecture that would show a recording, `practice`
 *    for a practice/proactive assignment). Not date-gated. `null` scope (resources,
 *    non-practice assignments, live lectures without a recording) is never restricted
 *    by the agreement ban.
 *
 * Returns `null` when the content is fully accessible.
 */
export function resolveLearnDetailRestriction(params: {
  contentBatchId: number | null
  schedule: string | null
  restrictions: UserBatchRestrictions
  agreementScope: 'recording' | 'practice' | null
}): LearnDetailRestriction | null {
  const { contentBatchId, schedule, restrictions, agreementScope } = params
  if (contentBatchId == null) return null

  const flags = restrictions.get(contentBatchId)
  if (!flags) return null

  if (flags.enrolmentCancelled) {
    return { kind: 'enrolment-cancelled' }
  }

  if (flags.paused) {
    const cutoff = getPausedCutoff(restrictions, contentBatchId)
    if (cutoff != null && isScheduledAfterCutoff(schedule, cutoff)) {
      return { kind: 'paused' }
    }
  }

  if (flags.agreementBanned && agreementScope != null) {
    return agreementScope === 'recording'
      ? { kind: 'agreement-recording', batchId: contentBatchId }
      : { kind: 'agreement-practice', batchId: contentBatchId }
  }

  return null
}
