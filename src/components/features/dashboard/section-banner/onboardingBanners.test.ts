import { describe, expect, it } from 'vitest'
import { buildOnboardingBanners } from './onboardingBanners'
import type {
  BatchT0Status,
  T0FlowStatus,
} from '@/server/api/dashboard/getT0FlowStatus.service'

const batch = (over: Partial<BatchT0Status> = {}): BatchT0Status => ({
  batchId: 5,
  batchName: 'MERN',
  showProgramTab: false,
  lms: { completed: 1, total: 4, complete: false },
  program: null,
  lectures: null,
  flowVariant: 'full',
  ...over,
})

const status = (over: Partial<T0FlowStatus> = {}): T0FlowStatus => ({
  showT0Flow: true,
  batches: [batch()],
  profilePhotoUrl: null,
  downloadAppCompleted: false,
  showGuidedTour: true,
  flowVariant: 'full',
  ...over,
})

describe('buildOnboardingBanners', () => {
  it('returns nothing for non-T0 users (or missing status)', () => {
    expect(buildOnboardingBanners(null)).toEqual([])
    expect(buildOnboardingBanners(status({ showT0Flow: false }))).toEqual([])
  })

  it('uses the LMS walkthrough alone when program onboarding is locked (partial fees)', () => {
    const banners = buildOnboardingBanners(status())
    expect(banners).toEqual([
      {
        batchId: 5,
        courseTitle: 'MERN',
        completed: 1,
        total: 4,
        targetTab: 'lms',
      },
    ])
  })

  it('sums LMS + program numerators and denominators when full fees are paid', () => {
    const banners = buildOnboardingBanners(
      status({
        batches: [
          batch({
            showProgramTab: true,
            lms: { completed: 4, total: 4, complete: true },
            program: { completed: 1, total: 3, complete: false },
          }),
        ],
      }),
    )
    // 4/4 + 1/3 = 5/7; walkthrough done, so resume on the program tab.
    expect(banners).toEqual([
      {
        batchId: 5,
        courseTitle: 'MERN',
        completed: 5,
        total: 7,
        targetTab: 'program',
      },
    ])
  })

  it('excludes courses whose onboarding is fully complete', () => {
    const banners = buildOnboardingBanners(
      status({
        batches: [
          batch({
            showProgramTab: true,
            lms: { completed: 4, total: 4, complete: true },
            program: { completed: 3, total: 3, complete: true },
          }),
        ],
      }),
    )
    expect(banners).toEqual([])
  })

  it('targets the LMS tab while the walkthrough is still pending, even with program work left', () => {
    const banners = buildOnboardingBanners(
      status({
        batches: [
          batch({
            showProgramTab: true,
            lms: { completed: 2, total: 4, complete: false },
            program: { completed: 0, total: 2, complete: false },
          }),
        ],
      }),
    )
    expect(banners[0].targetTab).toBe('lms')
    expect(banners[0]).toMatchObject({ completed: 2, total: 6 })
  })

  it('emits one banner per pending course (multi-course), carrying the course title', () => {
    const banners = buildOnboardingBanners(
      status({
        batches: [
          batch({ batchId: 5, batchName: 'MERN' }),
          batch({
            batchId: 6,
            batchName: 'Data Analytics',
            lms: { completed: 3, total: 3, complete: true },
            program: null,
          }),
          batch({
            batchId: 7,
            batchName: 'Cybersecurity',
            lms: { completed: 0, total: 5, complete: false },
          }),
        ],
      }),
    )
    // Batch 6 is complete (walkthrough done, program locked) → excluded.
    expect(banners.map((b) => b.courseTitle)).toEqual(['MERN', 'Cybersecurity'])
  })

  it('emits a banner for both a full admission batch and a lite agreement-only batch', () => {
    const banners = buildOnboardingBanners(
      status({
        batches: [
          batch({
            batchId: 348,
            batchName: 'BITSoM PM',
            flowVariant: 'full',
            showProgramTab: true,
            lms: { completed: 1, total: 3, complete: false },
            program: { completed: 0, total: 4, complete: false },
          }),
          batch({
            batchId: 354,
            batchName: 'IITP BuildStack AI',
            flowVariant: 'lite',
            showProgramTab: true,
            lms: { completed: 2, total: 2, complete: true },
            program: { completed: 0, total: 1, complete: false },
          }),
        ],
      }),
    )
    expect(banners.map((b) => b.courseTitle)).toEqual([
      'BITSoM PM',
      'IITP BuildStack AI',
    ])
    // Full batch: walkthrough pending → LMS tab. Lite batch: agreement only → program tab.
    expect(banners.map((b) => b.targetTab)).toEqual(['lms', 'program'])
  })
})
