import type { SeedFlowMeta } from '../../types'
import { flowScopedEmail } from '../onboarding-shared/constants'

const FLOW_ID = 'login-and-join-lecture'

const TIMING = {
  batchStartedDaysAgo: 0,
  lectureScheduledMinutesAgo: 0,
  lectureDurationMinutes: 120,
} as const

export const loginAndJoinLectureConfig: SeedFlowMeta = {
  id: 'login-and-join-lecture',
  description:
    'Student can log in and join a live lecture with an active join button.',
  timing: { ...TIMING },
  seedCommand: 'npm run seed login-and-join-lecture',
  defaultCredentialEmails: [
    { role: 'admin', email: flowScopedEmail(FLOW_ID, 'admin') },
    { role: 'student', email: flowScopedEmail(FLOW_ID, 'student') },
  ],
  primaryLoginRole: 'student',
}

export const loginAndJoinLectureTiming = TIMING
