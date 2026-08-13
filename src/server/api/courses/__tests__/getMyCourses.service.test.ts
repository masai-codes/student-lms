import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BatchRestrictionFlags } from '@/server/restrictions/types'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getBatchIdsForEnrolledUser: vi.fn(),
  getUserBatchRestrictions: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIdsForEnrolledUser,
}))
vi.mock('@/server/restrictions/getUserBatchRestrictions', () => ({
  getUserBatchRestrictions: hoisted.getUserBatchRestrictions,
}))

interface BatchRow {
  id: number
  name: string
  meta: unknown
  settings: unknown
}

/**
 * The service issues at most two selects: the ever-enrolled section→batch lookup
 * (always) and the batch row load (skipped when there is nothing to load).
 */
function mockDb(everEnrolled: Array<number>, batchRows: Array<BatchRow>) {
  hoisted.dbSelect.mockReset()
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      innerJoin: () => ({
        where: () => Promise.resolve(everEnrolled.map((batchId) => ({ batchId }))),
      }),
    }),
  })
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => Promise.resolve(batchRows) }),
  })
}

function flags(overrides: Partial<BatchRestrictionFlags> = {}): BatchRestrictionFlags {
  return {
    enrolmentCancelled: false,
    enrolmentCancelledDate: null,
    paused: false,
    pausedDate: null,
    agreementBanned: false,
    agreementBannedDate: null,
    ...overrides,
  }
}

const AIML: BatchRow = {
  id: 10,
  name: 'AIML Batch 3',
  meta: {
    courseTitle: 'AI & Machine Learning',
    instituteName: 'IIT Patna',
    courseLogo: 'https://cdn/aiml.png',
    courseTimeline: [
      { timeLine: '2000-01-01', mileStone: 'Start' },
      { timeLine: '2000-01-11', mileStone: 'End' },
    ],
  },
  settings: { showBatchDetails: true },
}

const FSWD: BatchRow = {
  id: 20,
  name: 'FSWD Batch 9',
  meta: {},
  settings: {},
}

async function run(userId = 7) {
  const { getMyCourses } = await import('../getMyCourses.service')
  return getMyCourses(userId)
}

describe('getMyCourses service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getUserBatchRestrictions.mockResolvedValue(new Map())
  })

  it('maps enrolled batches, newest enrolment first', async () => {
    // getBatchIdsForEnrolledUser returns oldest-first; the listing leads with newest.
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValue([20, 10])
    mockDb([10, 20], [AIML, FSWD])

    const result = await run()

    expect(result.cancelled).toEqual([])
    expect(result.active.map((c) => c.batchId)).toEqual([10, 20])
    expect(result.active[0]).toEqual({
      batchId: 10,
      courseTitle: 'AI & Machine Learning',
      instituteName: 'IIT Patna',
      courseLogo: 'https://cdn/aiml.png',
      courseProgress: 100, // timeline is entirely in the past
      showBatchDetails: true,
    })
  })

  it('falls back to the batch name, Masai, a null logo and 0% when meta is empty', async () => {
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValue([20])
    mockDb([20], [FSWD])

    const [course] = (await run()).active
    expect(course).toEqual({
      batchId: 20,
      courseTitle: 'FSWD Batch 9',
      instituteName: 'Masai',
      courseLogo: null,
      courseProgress: 0,
      showBatchDetails: false,
    })
  })

  it('lists a cancelled enrolment with its cancellation date', async () => {
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValue([])
    hoisted.getUserBatchRestrictions.mockResolvedValue(
      new Map([
        [10, flags({ enrolmentCancelled: true, enrolmentCancelledDate: '2026-07-01' })],
      ]),
    )
    mockDb([10], [AIML])

    const result = await run()
    expect(result.active).toEqual([])
    expect(result.cancelled).toEqual([
      {
        batchId: 10,
        courseTitle: 'AI & Machine Learning',
        instituteName: 'IIT Patna',
        courseLogo: 'https://cdn/aiml.png',
        cancelledOn: '2026-07-01',
      },
    ])
  })

  it('shows a batch only once when it is both section-enrolled and cancelled', async () => {
    // getBatchIdsForEnrolledUser already drops cancelled batches, so 10 never
    // reaches `active` even though section_user rows for it still exist.
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValue([20])
    hoisted.getUserBatchRestrictions.mockResolvedValue(
      new Map([[10, flags({ enrolmentCancelled: true })]]),
    )
    mockDb([10, 20], [AIML, FSWD])

    const result = await run()
    expect(result.active.map((c) => c.batchId)).toEqual([20])
    expect(result.cancelled.map((c) => c.batchId)).toEqual([10])
  })

  it('ignores restriction rows for batches the user was never enrolled in', async () => {
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValue([])
    hoisted.getUserBatchRestrictions.mockResolvedValue(
      new Map([[999, flags({ enrolmentCancelled: true })]]),
    )
    mockDb([10], [])

    await expect(run()).resolves.toEqual({ active: [], cancelled: [] })
  })

  it('ignores non-cancellation restrictions such as paused and agreement-banned', async () => {
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValue([20])
    hoisted.getUserBatchRestrictions.mockResolvedValue(
      new Map([[20, flags({ paused: true, agreementBanned: true })]]),
    )
    mockDb([20], [FSWD])

    const result = await run()
    expect(result.cancelled).toEqual([])
    expect(result.active.map((c) => c.batchId)).toEqual([20])
  })

  it('drops ids with no matching (or soft-deleted) batch row', async () => {
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValue([10, 20])
    hoisted.getUserBatchRestrictions.mockResolvedValue(
      new Map([[30, flags({ enrolmentCancelled: true })]]),
    )
    mockDb([10, 20, 30], [FSWD]) // batches 10 and 30 are gone

    const result = await run()
    expect(result.active.map((c) => c.batchId)).toEqual([20])
    expect(result.cancelled).toEqual([])
  })

  it('returns empty lists and skips the batch query when the user has no programs', async () => {
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValue([])
    mockDb([], [])

    await expect(run()).resolves.toEqual({ active: [], cancelled: [] })
    // Only the ever-enrolled lookup ran; there were no batch ids to load.
    expect(hoisted.dbSelect).toHaveBeenCalledTimes(1)
  })
})
