import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

export const DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID =
  'discussions-cancelled-enrollment' as const
export type DiscussionsCancelledEnrollmentFlowId =
  typeof DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID

export const discussionsCancelledEnrollmentConfig: SeedFlowMeta = {
  id: DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID,
  description:
    'A student whose batch-level enrolment has been cancelled (`batch_user.meta.batchEnrolmentCancelled = true`) while their section membership stays active. A second, healthy student authors a public discussion on a lecture in the same batch — exercises `listLearnDiscussionsForBatch`/`getBatchIdsForEnrolledUser` hiding that batch (and its discussions) for the cancelled student even though `section_user` is still active.',
  timing: {},
  seedCommand: 'npm run seed discussions-cancelled-enrollment',
  defaultCredentialEmails: [
    {
      role: 'admin',
      email: flowScopedEmail(DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID, 'admin'),
    },
    {
      role: 'student',
      email: flowScopedEmail(
        DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID,
        'student',
      ),
    },
    {
      role: 'student',
      email: flowScopedEmail(
        DISCUSSIONS_CANCELLED_ENROLLMENT_FLOW_ID,
        'author',
      ),
    },
  ],
  primaryLoginRole: 'student',
}
