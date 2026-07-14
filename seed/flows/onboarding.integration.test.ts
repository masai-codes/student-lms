import { describe, expect, it } from 'vitest'

import { seedFlow } from '../index'
import { isOnboardingEntities } from '../types'

describe('seed flow isolation', () => {
  const shouldRun =
    process.env.SEED_INTEGRATION === '1' && Boolean(process.env.DATABASE_URL)

  it.skipIf(!shouldRun)(
    'seeds two onboarding flows without colliding user or batch ids',
    async () => {
      const first = await seedFlow('onboarding-welcome-modal', { reset: true })
      const second = await seedFlow('onboarding-fees-unpaid', { reset: false })

      if (
        !isOnboardingEntities(first.entities) ||
        !isOnboardingEntities(second.entities)
      ) {
        throw new Error('Expected onboarding entities')
      }

      expect(first.entities.student.id).not.toBe(second.entities.student.id)
      expect(first.entities.batch.id).not.toBe(second.entities.batch.id)

      const { getWelcomeModalStatus } =
        await import('@/server/api/dashboard/getWelcomeModalStatus.service')
      const { getT0FlowStatus } =
        await import('@/server/api/dashboard/getT0FlowStatus.service')

      const [welcomeStatus, unpaidStatus] = await Promise.all([
        getWelcomeModalStatus(first.entities.student.id),
        getT0FlowStatus(second.entities.student.id),
      ])

      expect(welcomeStatus.showWelcomeModal).toBe(true)
      expect(unpaidStatus.showT0Flow).toBe(true)
      expect(unpaidStatus.batches[0]?.showProgramTab).toBe(false)
    },
    120_000,
  )
})

describe('onboarding integration', () => {
  const shouldRun =
    process.env.SEED_INTEGRATION === '1' && Boolean(process.env.DATABASE_URL)

  it.skipIf(!shouldRun)(
    'onboarding-fees-paid exposes program onboarding lectures',
    async () => {
      const result = await seedFlow('onboarding-fees-paid', { reset: true })
      if (!isOnboardingEntities(result.entities)) {
        throw new Error('Expected onboarding entities')
      }

      const { getT0FlowLectures } =
        await import('@/server/api/dashboard/getT0FlowLectures.service')

      const lectures = await getT0FlowLectures(
        result.entities.student.id,
        result.entities.batch.id,
      )

      expect(lectures.lmsLectures.length).toBeGreaterThan(0)
      expect(lectures.programLectures.length).toBeGreaterThan(0)
    },
    120_000,
  )
})
