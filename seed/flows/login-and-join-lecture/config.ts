import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_STUDENT_EMAIL,
} from '../../utils/constants'
import type { SeedFlowMeta } from '../../types'

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
    { role: 'admin', email: DEFAULT_ADMIN_EMAIL },
    { role: 'student', email: DEFAULT_STUDENT_EMAIL },
  ],
  primaryLoginRole: 'student',
}

export const loginAndJoinLectureTiming = TIMING
