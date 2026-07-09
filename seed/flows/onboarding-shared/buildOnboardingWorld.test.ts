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
  writeOnwardFixture: vi.fn(),
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

vi.mock('../../onward-simulation/onwardFixtureStore', () => ({
  writeOnwardFixture: hoisted.writeOnwardFixture,
}))

import { buildOnboardingWorld } from './buildOnboardingWorld'
import { getOnboardingScenario } from './scenarios'

describe('buildOnboardingWorld', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.SEED_WITH_APP_DOWNLOAD
    delete process.env.SEED_DOCS_REQUIRED
    delete process.env.SEED_DOCS_UPLOADED
    delete process.env.SEED_KIT_SHOWN
    delete process.env.SEED_KIT_FILLED
    delete process.env.SEED_KIT_TRACKING
    delete process.env.SEED_AGREEMENT_SIGNED

    // Default return shapes — flow-specific emails come from the call args, not these stubs.
    hoisted.createUser.mockImplementation(
      async (input: { email?: string; name?: string; username?: string }) => ({
        id: input.email?.includes('admin') ? 1 : 2,
        email: input.email,
        username: input.username,
        name: input.name ?? 'Test',
      }),
    )

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

    // First LMS title gets the newest schedule so ORDER BY schedule DESC matches tour order;
    // zoomLink is cleared so the player uses the recording URL only.
    expect(hoisted.createLecture).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'How to navigate the dashboard [onboarding-welcome-modal]',
        zoomLink: null,
        type: 'video',
      }),
    )
  })

  it('fees-unpaid leaves LMS steps incomplete for interactive testing', async () => {
    await buildOnboardingWorld(
      'onboarding-fees-unpaid',
      getOnboardingScenario('onboarding-fees-unpaid'),
    )

    expect(hoisted.createVideoAttendance).not.toHaveBeenCalled()
    expect(hoisted.createUserDeviceToken).not.toHaveBeenCalled()
    // Profile row exists for admission users, but no profile_pic → photo step unticked.
    expect(hoisted.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 2, legalData: undefined }),
    )
    expect(hoisted.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'onboarding-fees-unpaid.student@example.com',
        meta: { showWelcomeModal: true },
      }),
    )
  })

  it('fees-unpaid can be forced to pre-complete download-app', async () => {
    process.env.SEED_WITH_APP_DOWNLOAD = '1'

    await buildOnboardingWorld(
      'onboarding-fees-unpaid',
      getOnboardingScenario('onboarding-fees-unpaid'),
    )

    expect(hoisted.createUserDeviceToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 2,
        token: 'seed-device-onboarding-fees-unpaid',
        deviceType: 'ios',
      }),
    )
  })

  it('fees-paid writes a simulated onward fixture and mirrors kit fields into admission data', async () => {
    await buildOnboardingWorld('onboarding-fees-paid', getOnboardingScenario('onboarding-fees-paid'))

    expect(hoisted.writeOnwardFixture).toHaveBeenCalledWith('onboarding-fees-paid-student', {
      documents: {
        required: true,
        instituteSideUpload: false,
        documentsUploaded: false,
        documentsVerified: false,
        documentsPendingVerification: false,
      },
      kit: {
        showKit: true,
        welcomeKitUrl: null,
        detailsFilled: false,
        details: null,
        tracking: null,
      },
    })

    expect(hoisted.createUserBatchAdmissionData).toHaveBeenCalledWith(
      expect.objectContaining({
        studentKitExists: 1,
        studentKitDetailsFilled: 0,
        studentKitTrackingUrl: null,
      }),
    )

    // Agreement starts pending — no legalData is written until signed.
    expect(hoisted.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ legalData: undefined }),
    )
  })

  it('fees-paid flags fully complete documents/kit/agreement via env overrides', async () => {
    process.env.SEED_DOCS_UPLOADED = '1'
    process.env.SEED_KIT_FILLED = '1'
    process.env.SEED_KIT_TRACKING = '1'
    process.env.SEED_AGREEMENT_SIGNED = '1'

    await buildOnboardingWorld('onboarding-fees-paid', getOnboardingScenario('onboarding-fees-paid'))

    expect(hoisted.writeOnwardFixture).toHaveBeenCalledWith(
      'onboarding-fees-paid-student',
      expect.objectContaining({
        documents: expect.objectContaining({ required: true, documentsUploaded: true }),
        kit: expect.objectContaining({ showKit: true, detailsFilled: true, tracking: expect.any(String) }),
      }),
    )
    expect(hoisted.createUserBatchAdmissionData).toHaveBeenCalledWith(
      expect.objectContaining({ studentKitDetailsFilled: 1, studentKitTrackingUrl: expect.any(String) }),
    )
    expect(hoisted.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        legalData: expect.objectContaining({ agreements: expect.anything() }),
      }),
    )
  })

  it('complete seeds profile photo for the LMS walkthrough step', async () => {
    await buildOnboardingWorld('onboarding-complete', getOnboardingScenario('onboarding-complete'))

    expect(hoisted.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: { profile_pic: 'https://example.com/profile-photo.jpg' },
      }),
    )
  })

  it('skips admission data for legacy users', async () => {
    await buildOnboardingWorld(
      'onboarding-legacy-user',
      getOnboardingScenario('onboarding-legacy-user'),
    )

    expect(hoisted.createUserBatchAdmissionData).not.toHaveBeenCalled()
  })
})
