import type { db } from '@/db'
import type { CreateEnrolmentInput } from '@/server/api/webhooks/admissions/createEnrolment.schema'

/** The `tx` handle drizzle hands to a `db.transaction` callback. */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Which product a user belongs to — derived from the `isiHub` / `isiitj` flags
 * on the create-enrolment payload.
 *
 * Note this is *not* the type of the `client` field admissions now sends on the
 * cancel / events payloads: that one is matched against `users.client` verbatim
 * (a plain `varchar(20)`), so an unknown value must resolve to
 * `ENROLMENT_NOT_FOUND` rather than a 400. See `payloadClientSchema`.
 */
export type EnrolmentClient = 'ihub' | 'iitj' | 'masai'

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
  userId: number
  batchUserId: number
  validSectionIds: number[]
  invalidSectionIds: InvalidSection[]
}

/** Audit-trail entry types shared by the enrol and cancel flows. */
export const ENROLMENT_EVENT = {
  CREATED: 'created',
  REVIVED: 'revived',
  CANCELLED: 'cancelled',
} as const

export type EnrolmentEvent =
  (typeof ENROLMENT_EVENT)[keyof typeof ENROLMENT_EVENT]

/**
 * Event names the unified `/events` webhook accepts (the envelope `type` field).
 */
export const ADMISSION_EVENT = {
  BATCH_PAID: 'lms.batch.paid',
  BATCH_TRANSFER_CONSIDERED: 'lms.batch.transfer.considered',
  BATCH_TRANSFER_REJECTED: 'lms.batch.transfer.rejected',
  BATCH_TRANSFER_COMPLETED: 'lms.batch.transfer.completed',
  BATCH_PAUSE: 'lms.batch.pause',
  BATCH_UNPAUSE: 'lms.batch.unpause',
  INVOICE_GENERATED: 'lms.invoice.generated',
  FEE_DEADLINE_UPDATED: 'lms.fee.deadline.updated',
} as const

export type AdmissionEvent =
  (typeof ADMISSION_EVENT)[keyof typeof ADMISSION_EVENT]

/** Which webhook a stored `admissionPayloadHistory` entry came from. */
export const ADMISSION_PAYLOAD_TYPE = {
  ENROLMENT: 'enrolment',
  CANCEL: 'cancel',
  FULL_PAYMENT_RECEIVED: 'full_payment_received',
  BATCH_TRANSFER_CONSIDERED: 'batch_transfer_considered',
  BATCH_TRANSFER_REJECTED: 'batch_transfer_rejected',
  BATCH_TRANSFER_COMPLETED: 'batch_transfer_completed',
  BATCH_PAUSED: 'batch_paused',
  BATCH_UNPAUSED: 'batch_unpaused',
  INVOICE_GENERATED: 'invoice_generated',
  FEE_DEADLINE_UPDATED: 'fee_deadline_updated',
} as const

/** `batch_user.status` values this integration writes. */
export const BATCH_USER_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'enrolment_cancelled',
} as const

/**
 * `batch_user.batch_transfer_status` values. Code-level enum only — the DB
 * column is a plain varchar, not a DB enum.
 */
export const BATCH_TRANSFER_STATUS = {
  CONSIDERED: 'considered',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const

export type BatchTransferStatus =
  (typeof BATCH_TRANSFER_STATUS)[keyof typeof BATCH_TRANSFER_STATUS]

export type CancelEnrolmentResult = {
  batchUserId: number
  userId: number
  batchId: number
  cancelledSectionUserIds: number[]
}

export type { CreateEnrolmentInput }
