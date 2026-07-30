import {
  INVALID_SECTION_REASON,
  type InvalidSectionReason,
} from '@/server/api/webhooks/admissions/types'

export type SectionClassifyRow =
  | {
      id: number
      batchId: number
      active: number
      deletedAt: string | null
    }
  | undefined

/**
 * Decide whether a requested section can be enrolled into for `batchId`.
 * Returns `null` when the section is valid, otherwise the reason it is rejected.
 * Order matters: a missing row is reported before deleted/inactive/mismatch.
 */
export function classifySection(
  row: SectionClassifyRow,
  batchId: number,
): InvalidSectionReason | null {
  if (!row) return INVALID_SECTION_REASON.NOT_FOUND
  if (row.deletedAt !== null) return INVALID_SECTION_REASON.DELETED
  if (Number(row.active) !== 1) return INVALID_SECTION_REASON.INACTIVE
  if (row.batchId !== batchId) return INVALID_SECTION_REASON.BATCH_MISMATCH
  return null
}
