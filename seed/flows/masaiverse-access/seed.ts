import {
  createBatch,
  createEnrollment,
  createSection,
  createUser,
} from '../../factories'
import type { SeedFlowResult, TestUser } from '../../types'
import { DEV_PASSWORD_PLAINTEXT } from '../../utils/constants'
import { formatMysqlDate, offsetFromNow } from '../../utils/time'
import { flowScopedEmail } from '../onboarding-shared/constants'
import { masaiverseAccessConfig } from './config'

const FLOW_ID = masaiverseAccessConfig.id

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
 * Seeds a student enrolled in a batch with `meta.show_masaiverse: true` — the
 * only signal `getMasaiverseAccessDebug` (src/server/masaiverse/showMasaiversePage.ts)
 * checks to grant MasaiVerse access. Every other seeded student is enrolled in
 * a batch without this flag, so the navbar's Community tab falls back to
 * showing "Refer & Earn" for them instead of MasaiVerse.
 */
export async function seedMasaiverseAccess(): Promise<SeedFlowResult> {
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
    meta: { show_masaiverse: true },
  })

  const section = await createSection({ batchId: batch.id })

  const enrollment = await createEnrollment({
    sectionId: section.id,
    userId: student.id,
    managerId: admin.id,
  })

  return {
    flowId: masaiverseAccessConfig.id,
    entities: { admin, student, batch, section, enrollment },
    testUsers: buildTestUsers(admin, student),
    timing: {
      batchStarting: formatMysqlDate(batchStart),
    },
  }
}
