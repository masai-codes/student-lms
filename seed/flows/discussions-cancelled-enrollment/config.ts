import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

export const DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID =
  'discussions-cancelled-enrollment' as const
export type DiscussionsCancelledEnrollmentFlowId =
  typeof DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID

export const discussionsCancelledEnrollmentConfig: SeedFlowMeta = {
  id: DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID,
  description:
    'A student enrolled in two batches: batch-level enrolment cancelled (`batch_user.meta.batchEnrolmentCancelled = true`) in the first while their section membership stays active, and healthy/active in the second. Each batch has its own section and a public discussion authored by multiple people — a batch-local healthy student plus the multi-batch student themself — exercising `listLearnDiscussionsForBatch`/`getBatchIdsForEnrolledUser` hiding the cancelled batch (and its discussions) while the healthy batch and its discussions remain fully visible.',
  timing: {},
  seedCommand: 'npm run seed discussions-cancelled-enrollment',
  defaultCredentialEmails: [
    {
      role: 'admin',
      email: flowScopedEmail(DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID, 'admin'),
    },
    {
      // Multi-batch student: cancelled in batch A, healthy/active in batch B.
      role: 'student',
      email: flowScopedEmail(
        DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID,
        'student',
      ),
    },
    {
      // Healthy, batch-A-only student — discussion author on the cancelled batch.
      role: 'author',
      email: flowScopedEmail(
        DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID,
        'author',
      ),
    },
    {
      // Healthy, batch-B-only student — discussion author on the healthy batch.
      role: 'author2',
      email: flowScopedEmail(
        DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID,
        'author2',
      ),
    },
  ],
  primaryLoginRole: 'student',
}
