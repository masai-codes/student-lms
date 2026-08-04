import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

export const MULTI_PROGRAM_STUDENT_FLOW_ID = 'multi-program-student' as const
export type MultiProgramStudentFlowId = typeof MULTI_PROGRAM_STUDENT_FLOW_ID

export const multiProgramStudentConfig: SeedFlowMeta = {
  id: MULTI_PROGRAM_STUDENT_FLOW_ID,
  description:
    'Student enrolled in two programs/batches — the live-lecture-phases world (SDE) plus a second batch (Data Science) with its own section and lecture. Exercises the /learn batch switcher and `getEnrolledBatchesForUser` for a multi-batch student.',
  timing: {},
  seedCommand: 'npm run seed multi-program-student',
  defaultCredentialEmails: [
    {
      role: 'admin',
      email: flowScopedEmail(MULTI_PROGRAM_STUDENT_FLOW_ID, 'admin'),
    },
    {
      role: 'student',
      email: flowScopedEmail(MULTI_PROGRAM_STUDENT_FLOW_ID, 'student'),
    },
  ],
  primaryLoginRole: 'student',
}
