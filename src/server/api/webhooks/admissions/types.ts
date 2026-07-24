import type { db } from '@/db'
import type { CreateEnrolmentInput } from '@/server/api/webhooks/admissions/createEnrolment.schema'

/** The `tx` handle drizzle hands to a `db.transaction` callback. */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Which product a user belongs to — derived from the `isiHub` flag on the payload. */
export type EnrolmentClient = 'ihub' | 'masai'

/** Why a requested section could not be enrolled into. */
export const INVALID_SECTION_REASON = {
  NOT_FOUND: 'NOT_FOUND',
  DELETED: 'DELETED',
  INACTIVE: 'INACTIVE',
  BATCH_MISMATCH: 'BATCH_MISMATCH',
} as const

export type InvalidSectionReason =
  (typeof INVALID_SECTION_REASON)[keyof typeof INVALID_SECTION_REASON]

export type InvalidSection = {
  sectionId: number
  reason: InvalidSectionReason
}

export type CreateEnrolmentResult = {
  batchUserId: number
  invalidSectionIds: InvalidSection[]
}

export type { CreateEnrolmentInput }
