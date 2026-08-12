import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as GuidedTourProgressModule from '../t0/guidedTourProgress'

const hoisted = vi.hoisted(() => ({
  execute: vi.fn(),
  getBatchIds: vi.fn(),
  computeFull: vi.fn(),
  appDownloaded: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { execute: hoisted.execute } }))
vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIds,
}))
vi.mock('@/server/devices/hasCompletedAppDownload', () => ({
  hasCompletedAppDownload: hoisted.appDownloaded,
}))
vi.mock('../t0/guidedTourProgress', async () => {
  const actual = await vi.importActual<typeof GuidedTourProgressModule>(
    '../t0/guidedTourProgress',
  )
  return { ...actual, computeGuidedTourProgress: hoisted.computeFull }
})

const INPUT = {
  lectureId: 900,
  batchId: 348,
  tab: 'lms' as const,
  watchedSeconds: 120,
}

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.getBatchIds.mockResolvedValue([348])
  // db.execute order: lecture lookup → attendance select → attendance insert →
  // admission row → profile row → the meta UPDATE. The section type has no
  // `-web`/`-app` sibling, so the sibling sync is skipped.
  hoisted.execute
    .mockResolvedValueOnce([
      {
        id: 900,
        title: 'Welcome',
        section_id: 55,
        section_type: 'lms-walkthrough',
      },
    ])
    .mockResolvedValueOnce([]) // no existing attendance
    .mockResolvedValueOnce([]) // insert
    .mockResolvedValueOnce([{ full_fees_paid: 1, meta: '{}' }]) // admission
    .mockResolvedValueOnce([{ meta: null, legal_data: null }]) // profile
    .mockResolvedValue([]) // meta UPDATE and anything after
  hoisted.computeFull.mockResolvedValue({
    lms: { completed: 2, total: 3 },
    program: { completed: 1, total: 2 },
  })
})

describe('recordGuidedTourStepCompleted', () => {
  it('passes the app-download signal into the stored progress computation', async () => {
    hoisted.appDownloaded.mockResolvedValue(true)
    const { recordGuidedTourStepCompleted } =
      await import('../recordGuidedTourStepCompleted.service')
    await recordGuidedTourStepCompleted(10030696, INPUT)

    expect(hoisted.appDownloaded).toHaveBeenCalledWith(10030696)
    // 6th positional arg of computeGuidedTourProgress is the app-download flag.
    expect(hoisted.computeFull.mock.calls[0][5]).toBe(true)
  })

  it('passes false through when neither app signal is present', async () => {
    hoisted.appDownloaded.mockResolvedValue(false)
    const { recordGuidedTourStepCompleted } =
      await import('../recordGuidedTourStepCompleted.service')
    await recordGuidedTourStepCompleted(10030696, INPUT)

    expect(hoisted.computeFull.mock.calls[0][5]).toBe(false)
  })
})
