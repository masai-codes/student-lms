import type { LearnBanRestriction } from '@/server/learn/types'
import type { UserBatchBans } from '@/server/users/batchBan'
import { isScheduledAfterBanCutoff } from '@/server/users/batchBan'

/**
 * Resolves the ban restriction for a single detail page.
 *
 * Normal ban wins (whole-page block) when the content's batch is normal-banned and
 * the item is scheduled after that ban's date (date-gated). Otherwise, if an
 * agreement restriction applies to this content kind (`recording` for lectures,
 * `practice` for practice assignments) and the content's batch is agreement-banned,
 * that partial restriction is returned. The agreement ban is NOT date-gated — it
 * applies to all such content in the banned batch. Resources and non-practice
 * assignments pass `null` for `agreementRestrictionKind` (agreement never restricts them).
 */
export function resolveLearnDetailBanRestriction(params: {
  contentBatchId: number | null
  schedule: string | null
  bans: UserBatchBans
  agreementRestrictionKind: 'recording' | 'practice' | null
}): LearnBanRestriction | null {
  const { contentBatchId, schedule, bans, agreementRestrictionKind } = params
  if (contentBatchId == null) return null

  const normalCutoff = bans.normalByBatch.get(contentBatchId)
  if (normalCutoff != null && isScheduledAfterBanCutoff(schedule, normalCutoff)) {
    return { kind: 'page' }
  }

  if (
    agreementRestrictionKind != null &&
    bans.agreementByBatch.has(contentBatchId)
  ) {
    return { kind: agreementRestrictionKind }
  }

  return null
}
