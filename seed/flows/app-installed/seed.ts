import {
  createBatch,
  createEnrollment,
  createSection,
  createUser,
  createUserDeviceToken,
} from '../../factories'
import type { SeedFlowResult, TestUser } from '../../types'
import { DEV_PASSWORD_PLAINTEXT } from '../../utils/constants'
import { formatMysqlDate, offsetFromNow } from '../../utils/time'
import { flowScopedEmail } from '../onboarding-shared/constants'
import { appInstalledConfig } from './config'

const FLOW_ID = appInstalledConfig.id

function buildTestUsers(
  admin: SeedFlowResult['entities']['admin'],
  student: SeedFlowResult['entities']['student'],
): TestUser[] {
  return [
    {
      role: 'admin',
      email: admin.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: admin.id,
      name: admin.name,
    },
    {
      role: 'student',
      email: student.email,
      password: DEV_PASSWORD_PLAINTEXT,
      userId: student.id,
      name: student.name,
    },
  ]
}

/**
 * Seeds a student with a single active device-token row — the only signal
 * `isAppInstalledForUser` (src/server/devices/isAppInstalledForUser.ts) checks
 * to treat the mobile app as installed. Every other seeded student has no
 * device-token row (or none marked `active`), so the navbar's "Get the app"
 * pill shows for them instead.
 */
export async function seedAppInstalled(): Promise<SeedFlowResult> {
  const batchStart = offsetFromNow({ daysAgo: 30 })

  const admin = await createUser({
    name: 'Admin User',
    email: flowScopedEmail(FLOW_ID, 'admin'),
    role: 'admin',
  })

  const student = await createUser({
    name: 'Student User',
    email: flowScopedEmail(FLOW_ID, 'student'),
    role: 'student',
  })

  const batch = await createBatch({
    name: `FT-MOCK-1 [${FLOW_ID}]`,
    starting: formatMysqlDate(batchStart),
  })

  const section = await createSection({ batchId: batch.id })

  const enrollment = await createEnrollment({
    sectionId: section.id,
    userId: student.id,
    managerId: admin.id,
  })

  const deviceToken = await createUserDeviceToken({
    userId: student.id,
    token: `seed-device-${FLOW_ID}`,
    deviceType: 'ios',
    deviceName: 'Seed iPhone',
    active: 1,
  })

  return {
    flowId: appInstalledConfig.id,
    entities: { admin, student, batch, section, enrollment, deviceToken },
    testUsers: buildTestUsers(admin, student),
    timing: {
      batchStarting: formatMysqlDate(batchStart),
    },
  }
}
