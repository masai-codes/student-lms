import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  createUser: vi.fn(),
  createBatch: vi.fn(),
  createSection: vi.fn(),
  createLecture: vi.fn(),
  createEnrollment: vi.fn(),
  createUserBatchAdmissionData: vi.fn(),
  createProfile: vi.fn(),
  createUserDeviceToken: vi.fn(),
  createVideoAttendance: vi.fn(),
}))

vi.mock('../../factories/index.ts', () => ({
  createUser: hoisted.createUser,
  createBatch: hoisted.createBatch,
  createSection: hoisted.createSection,
  createLecture: hoisted.createLecture,
  createEnrollment: hoisted.createEnrollment,
  createUserBatchAdmissionData: hoisted.createUserBatchAdmissionData,
  createProfile: hoisted.createProfile,
  createUserDeviceToken: hoisted.createUserDeviceToken,
  createVideoAttendance: hoisted.createVideoAttendance,
}))

import { buildOnboardingWorld } from './buildOnboardingWorld'
import { getOnboardingScenario } from './scenarios'

describe('buildOnboardingWorld', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hoisted.createUser
      .mockResolvedValueOnce({ id: 1, email: 'onboarding-welcome-modal.admin@example.com' })
      .mockResolvedValueOnce({
        id: 2,
        email: 'onboarding-welcome-modal.student@example.com',
      })

    hoisted.createBatch.mockResolvedValue({ id: 10, starting: '2026-07-03' })

    let sectionId = 100
    hoisted.createSection.mockImplementation(async (input: { name: string; type: string }) => ({
      id: sectionId++,
      name: input.name,
      type: input.type,
    }))

    let lectureId = 200
    hoisted.createLecture.mockImplementation(async (input: { title: string }) => ({
      id: lectureId++,
      title: input.title,
    }))

    hoisted.createEnrollment.mockResolvedValue({ id: 300 })
    hoisted.createUserBatchAdmissionData.mockResolvedValue({
      id: 400,
      lmsAccessDate: '2026-07-03 10:00:00',
    })
    hoisted.createProfile.mockResolvedValue({ id: 600 })
  })

  it('creates isolated users, four sections, and paired lectures', async () => {
    const world = await buildOnboardingWorld(
      'onboarding-welcome-modal',
      getOnboardingScenario('onboarding-welcome-modal'),
    )

    expect(hoisted.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'onboarding-welcome-modal.admin@example.com',
      }),
    )
    expect(hoisted.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'onboarding-welcome-modal.student@example.com',
      }),
    )
    expect(hoisted.createBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'SDE Batch 42 [onboarding-welcome-modal]',
      }),
    )
    expect(hoisted.createSection).toHaveBeenCalledTimes(4)
    expect(hoisted.createLecture).toHaveBeenCalledTimes(10)
    expect(hoisted.createEnrollment).toHaveBeenCalledTimes(4)
    expect(hoisted.createUserBatchAdmissionData).toHaveBeenCalledOnce()
    expect(world.admission).not.toBeNull()
  })

  it('skips admission data for legacy users', async () => {
    await buildOnboardingWorld(
      'onboarding-legacy-user',
      getOnboardingScenario('onboarding-legacy-user'),
    )

    expect(hoisted.createUserBatchAdmissionData).not.toHaveBeenCalled()
  })
})
