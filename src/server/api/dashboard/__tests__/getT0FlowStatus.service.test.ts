import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  execute: vi.fn(),
  select: vi.fn(),
  getBatchIds: vi.fn(),
  computeFull: vi.fn(),
  computeLite: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { execute: hoisted.execute, select: hoisted.select } }))
vi.mock('@/db/schema', () => ({ batches: {}, userDeviceTokens: {} }))
vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIds,
}))
vi.mock('../courseTitle', () => ({
  resolveCourseTitle: (_meta: unknown, name: string | null) => name ?? '',
}))
vi.mock('../t0/guidedTourProgress', async () => {
  const actual = await vi.importActual<
    typeof import('../t0/guidedTourProgress')
  >('../t0/guidedTourProgress')
  return {
    ...actual,
    computeGuidedTourProgress: hoisted.computeFull,
    computeLiteGuidedTourProgress: hoisted.computeLite,
  }
})

describe('getT0FlowStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The four parallel loads, in evaluation order: admission rows (execute),
    // batch rows (select), profile (execute), device tokens (select).
    hoisted.execute
      .mockResolvedValueOnce([{ batch_id: 348, full_fees_paid: 1, meta: '{}' }]) // admission
      .mockResolvedValueOnce([{ meta: null, legal_data: null }]) // profile
    hoisted.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => [
            { id: 348, name: 'BITSoM PM', meta: null },
            { id: 354, name: 'IITP BuildStack AI', meta: null },
            { id: 999, name: 'Legacy no-agreement', meta: null },
          ],
        }),
      })
      .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => [] }) }) })
    hoisted.getBatchIds.mockResolvedValue([348, 354, 999])
    // Batch 348 has an admission row → full flow, walkthrough + program pending.
    hoisted.computeFull.mockResolvedValue({
      lms: { completed: 1, total: 3 },
      program: { completed: 0, total: 4 },
    })
    // Lite batches: 354 has a signable agreement (program.total 1), 999 has none.
    hoisted.computeLite.mockImplementation((_userId: number, batchId: number) =>
      Promise.resolve(
        batchId === 354
          ? { lms: { completed: 2, total: 2 }, program: { completed: 0, total: 1 } }
          : { lms: { completed: 2, total: 2 }, program: { completed: 0, total: 0 } },
      ),
    )
  })

  it('surfaces a full admission batch and a lite agreement-only batch together', async () => {
    const { getT0FlowStatus } = await import('../getT0FlowStatus.service')
    const status = await getT0FlowStatus(10030696)

    expect(status.showT0Flow).toBe(true)
    expect(status.flowVariant).toBe('full')
    // 348 (full) + 354 (lite w/ agreement); 999 (lite, no agreement) is excluded.
    expect(status.batches.map((b) => ({ batchId: b.batchId, flowVariant: b.flowVariant }))).toEqual([
      { batchId: 348, flowVariant: 'full' },
      { batchId: 354, flowVariant: 'lite' },
    ])

    const full = status.batches[0]
    expect(full.lms.complete).toBe(false) // walkthrough 1/3
    expect(full.program?.complete).toBe(false) // agreement/videos pending

    const lite = status.batches[1]
    expect(lite.showProgramTab).toBe(true)
    expect(lite.lms.complete).toBe(true) // photo + app done
    expect(lite.program?.complete).toBe(false) // agreement pending
    expect(status.showGuidedTour).toBe(true)
  })
})
