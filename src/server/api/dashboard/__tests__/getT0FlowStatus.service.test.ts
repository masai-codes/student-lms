import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  execute: vi.fn(),
  select: vi.fn(),
  getBatchIds: vi.fn(),
  computeFull: vi.fn(),
  computeLite: vi.fn(),
  appDownloaded: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { execute: hoisted.execute, select: hoisted.select },
}))
vi.mock('@/db/schema', () => ({ batches: {} }))
vi.mock('@/server/devices/hasCompletedAppDownload', () => ({
  hasCompletedAppDownload: hoisted.appDownloaded,
}))
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
    // batch rows (select), profile (execute), app-download signal (helper).
    hoisted.execute
      .mockResolvedValueOnce([{ batch_id: 348, full_fees_paid: 1, meta: '{}' }]) // admission
      .mockResolvedValueOnce([{ meta: null, legal_data: null }]) // profile
    hoisted.select.mockReturnValueOnce({
      from: () => ({
        where: () => [
          { id: 348, name: 'BITSoM PM', meta: null },
          { id: 354, name: 'IITP BuildStack AI', meta: null },
          { id: 999, name: 'Legacy no-agreement', meta: null },
        ],
      }),
    })
    hoisted.appDownloaded.mockResolvedValue(false)
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
          ? {
              lms: { completed: 2, total: 2 },
              program: { completed: 0, total: 1 },
            }
          : {
              lms: { completed: 2, total: 2 },
              program: { completed: 0, total: 0 },
            },
      ),
    )
  })

  it('surfaces a full admission batch and a lite agreement-only batch together', async () => {
    const { getT0FlowStatus } = await import('../getT0FlowStatus.service')
    const status = await getT0FlowStatus(10030696)

    expect(status.showT0Flow).toBe(true)
    expect(status.flowVariant).toBe('full')
    // 348 (full) + 354 (lite w/ agreement); 999 (lite, no agreement) is excluded.
    expect(
      status.batches.map((b) => ({
        batchId: b.batchId,
        flowVariant: b.flowVariant,
      })),
    ).toEqual([
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

  it('reports download-app complete from the app-download signal, and passes it into progress', async () => {
    hoisted.appDownloaded.mockResolvedValue(true)
    const { getT0FlowStatus } = await import('../getT0FlowStatus.service')
    const status = await getT0FlowStatus(10030696)

    expect(status.downloadAppCompleted).toBe(true)
    // 6th positional arg of computeGuidedTourProgress is the app-download flag.
    expect(hoisted.computeFull.mock.calls[0][5]).toBe(true)
    expect(hoisted.computeLite.mock.calls[0][4]).toBe(true)
  })

  it('reports download-app incomplete when neither signal is present', async () => {
    hoisted.appDownloaded.mockResolvedValue(false)
    const { getT0FlowStatus } = await import('../getT0FlowStatus.service')
    const status = await getT0FlowStatus(10030696)

    expect(status.downloadAppCompleted).toBe(false)
    expect(hoisted.computeFull.mock.calls[0][5]).toBe(false)
  })
})

describe('getT0FlowStatus — non-T0 multi-batch (no admission rows)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Same evaluation order, but the learner has NO admission rows at all.
    hoisted.execute
      .mockResolvedValueOnce([]) // admission: none → pure-lite path
      .mockResolvedValueOnce([{ meta: null, legal_data: null }]) // profile
    hoisted.select.mockReturnValueOnce({
      from: () => ({
        where: () => [
          { id: 10, name: 'Batch A', meta: null },
          { id: 20, name: 'Batch B', meta: null },
          { id: 30, name: 'Batch C (no agreement)', meta: null },
        ],
      }),
    })
    hoisted.appDownloaded.mockResolvedValue(false)
    hoisted.getBatchIds.mockResolvedValue([10, 20, 30])
  })

  it('surfaces every batch with a pending agreement (not just one), and auto-opens when a step is pending', async () => {
    // Photo done, app missing → lms 1/2 (user-level) for all; batches 10 & 20
    // have signable agreements, batch 30 has none.
    hoisted.computeLite.mockImplementation((_u: number, batchId: number) =>
      Promise.resolve({
        lms: { completed: 1, total: 2 },
        program: { completed: 0, total: batchId === 30 ? 0 : 1 },
      }),
    )
    const { getT0FlowStatus } = await import('../getT0FlowStatus.service')
    const status = await getT0FlowStatus(555)

    expect(status.flowVariant).toBe('lite')
    // 10 & 20 (agreements) + 30 (anchor = max id, carries the user-level steps).
    expect(status.batches.map((b) => b.batchId)).toEqual([10, 20, 30])
    expect(status.batches.every((b) => b.flowVariant === 'lite')).toBe(true)
    // A pending step anywhere → the tour opens automatically.
    expect(status.showGuidedTour).toBe(true)
  })

  it('drops a non-anchor batch with no batch-specific step (avoids duplicate photo/app banners)', async () => {
    // Photo + app complete (lms done); only batch 20 has a pending agreement.
    hoisted.computeLite.mockImplementation((_u: number, batchId: number) =>
      Promise.resolve({
        lms: { completed: 2, total: 2 },
        program: { completed: 0, total: batchId === 20 ? 1 : 0 },
      }),
    )
    const { getT0FlowStatus } = await import('../getT0FlowStatus.service')
    const status = await getT0FlowStatus(555)

    // Anchor = 30 (max id) always kept; 20 kept for its agreement; 10 dropped
    // (not the anchor and no agreement).
    expect(status.batches.map((b) => b.batchId)).toEqual([20, 30])
    expect(status.showGuidedTour).toBe(true) // batch 20's agreement is pending
  })
})
