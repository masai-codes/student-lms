import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  getBatchIdsForEnrolledUser: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
  },
}))

vi.mock('@/server/batches/getBatchIdsForEnrolledUser', () => ({
  getBatchIdsForEnrolledUser: hoisted.getBatchIdsForEnrolledUser,
}))

describe('getEnrolledBatchesForUser service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty list when user has no enrolled batch ids', async () => {
    const { getEnrolledBatchesForUser } =
      await import('../services/getEnrolledBatches.service')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([])

    await expect(getEnrolledBatchesForUser(77)).resolves.toEqual([])
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('maps db rows to {batchId, courseTitle} and returns newest enrollment first', async () => {
    const { getEnrolledBatchesForUser } =
      await import('../services/getEnrolledBatches.service')
    // Enrollment order from the shared query is oldest-first: batch 1, then batch 2.
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([1, 2])
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: 2, name: 'Cohort B', meta: { courseTitle: 'DS Cohort B' } },
            { id: 1, name: 'Cohort A', meta: {} },
          ]),
      }),
    })

    // …so the dropdown gets batch 2 (newest enrollment) first.
    await expect(getEnrolledBatchesForUser(77)).resolves.toEqual([
      {
        batchId: 2,
        courseTitle: 'DS Cohort B',
        courseLogo: null,
        showAttendanceReport: false,
        showEvaluationReport: false,
        showBatchDetails: false,
        showSectionDropdown: false,
      },
      {
        batchId: 1,
        courseTitle: 'Cohort A',
        courseLogo: null,
        showAttendanceReport: false,
        showEvaluationReport: false,
        showBatchDetails: false,
        showSectionDropdown: false,
      },
    ])
  })

  it('reads courseLogo from batch meta when present', async () => {
    const { getEnrolledBatchesForUser } =
      await import('../services/getEnrolledBatches.service')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([9])
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        where: () =>
          Promise.resolve([
            {
              id: 9,
              name: 'Cohort Z',
              meta: {
                courseTitle: 'PM with AI',
                courseLogo: 'https://cdn.example/logo.png ',
              },
            },
          ]),
      }),
    })

    await expect(getEnrolledBatchesForUser(77)).resolves.toEqual([
      {
        batchId: 9,
        courseTitle: 'PM with AI',
        courseLogo: 'https://cdn.example/logo.png',
        showAttendanceReport: false,
        showEvaluationReport: false,
        showBatchDetails: false,
        showSectionDropdown: false,
      },
    ])
  })

  it('flags showBatchDetails from batch settings', async () => {
    const { getEnrolledBatchesForUser } =
      await import('../services/getEnrolledBatches.service')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([3])
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: 3, name: 'Cohort C', settings: { showBatchDetails: true } },
          ]),
      }),
    })

    await expect(getEnrolledBatchesForUser(77)).resolves.toEqual([
      {
        batchId: 3,
        courseTitle: 'Cohort C',
        courseLogo: null,
        showAttendanceReport: false,
        showEvaluationReport: false,
        showBatchDetails: true,
        showSectionDropdown: false,
      },
    ])
  })

  it('flags showSectionDropdown from batch meta', async () => {
    const { getEnrolledBatchesForUser } =
      await import('../services/getEnrolledBatches.service')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([4])
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: 4, name: 'Cohort D', meta: { showSectionDropdown: true } },
          ]),
      }),
    })

    await expect(getEnrolledBatchesForUser(77)).resolves.toEqual([
      {
        batchId: 4,
        courseTitle: 'Cohort D',
        courseLogo: null,
        showAttendanceReport: false,
        showEvaluationReport: false,
        showBatchDetails: false,
        showSectionDropdown: true,
      },
    ])
  })

  it('treats a non-boolean meta.showSectionDropdown as disabled', async () => {
    const { getEnrolledBatchesForUser } =
      await import('../services/getEnrolledBatches.service')
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([5])
    hoisted.dbSelect.mockReturnValueOnce({
      from: () => ({
        where: () =>
          Promise.resolve([
            { id: 5, name: 'Cohort E', meta: { showSectionDropdown: 'true' } },
          ]),
      }),
    })

    await expect(getEnrolledBatchesForUser(77)).resolves.toEqual([
      {
        batchId: 5,
        courseTitle: 'Cohort E',
        courseLogo: null,
        showAttendanceReport: false,
        showEvaluationReport: false,
        showBatchDetails: false,
        showSectionDropdown: false,
      },
    ])
  })
})
