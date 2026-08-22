import { cancelEnrolmentSchema } from '@/server/api/webhooks/admissions/cancelEnrolment.schema'

/**
 * Payload the admissions platform sends to the undo-cancel-enrolment webhook —
 * deliberately the *same* shape as cancel-enrolment (`enrolment_id` plus the
 * optional `client` / `batch_id` scopes), because it has to address exactly the
 * same `batch_user` row the cancel call addressed. Aliasing the schema rather
 * than re-declaring it keeps the two from drifting apart.
 */
export const undoCancelEnrolmentSchema = cancelEnrolmentSchema

export type UndoCancelEnrolmentInput = typeof undoCancelEnrolmentSchema._output
