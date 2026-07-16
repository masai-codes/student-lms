/**
 * Batch/agreement restriction model.
 *
 * Restrictions are authored by admins on the `batch_user` row and stored as a
 * small JSON blob in `batch_user.meta`. This repo only READS them; the write side
 * lives in the external admin app. Recognised keys (IST wall-clock dates):
 *   {"batchEnrolmentCancelled":true,"batchEnrolmentCancelledDate":"2026-07-01",
 *    "batchPaused":true,"batchPausedDate":"2026-07-02",
 *    "aggrementBanned":true,"aggrementBannedDate":"2026-07-03"}
 *
 * Three per-batch states, in decreasing severity:
 * - `enrolmentCancelled`: the batch is hidden entirely (treated as "not enrolled").
 * - `paused`: content scheduled AFTER the pause date is hidden; earlier content stays.
 * - `agreementBanned`: NOT date-gated — only the lecture recording and practice
 *   (proactive) assignment attempt are blocked; everything else is allowed.
 * (User-level deactivation lives on `users.status`, see {@link ./deactivatedUser}.)
 */

/** Parsed restriction flags for a single (user, batch) pair. */
export interface BatchRestrictionFlags {
  enrolmentCancelled: boolean
  /** IST wall-clock date the enrolment was cancelled (informational). */
  enrolmentCancelledDate: string | null
  paused: boolean
  /** IST wall-clock cutoff — content scheduled after this is hidden. */
  pausedDate: string | null
  agreementBanned: boolean
  /** IST wall-clock date the agreement ban was applied (informational). */
  agreementBannedDate: string | null
}

/** batchId -> restriction flags. Absence of a key = no restriction in that batch. */
export type UserBatchRestrictions = Map<number, BatchRestrictionFlags>

/**
 * Backend-computed restriction for a single detail page. The frontend renders the
 * matching gated UI purely from this value — it never derives the restriction itself.
 * - `enrolment-cancelled`: whole-page block — the user's enrolment in this batch is cancelled.
 * - `paused`: whole-page block — content scheduled after the batch's pause date.
 * - `agreement-recording`: whole-page block for a lecture that would show a recording;
 *   `batchId` lets the frontend deep-link the onboarding agreement step for that batch.
 * - `agreement-practice`: whole-page block for a practice (proactive) assignment;
 *   `batchId` as above.
 */
export type LearnDetailRestriction =
  | { kind: 'enrolment-cancelled' }
  | { kind: 'paused' }
  | { kind: 'agreement-recording'; batchId: number }
  | { kind: 'agreement-practice'; batchId: number }
