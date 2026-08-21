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

function chainSelect<T>(result: T) {
  return {
    from: () => ({
      innerJoin: () => ({
        where: () => Promise.resolve(result),
      }),
      where: () => Promise.resolve(result),
    }),
  }
}

describe('getOneOnOneGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty list when the user has no enrolled batches', async () => {
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([])

    const { getOneOnOneGroups } = await import('../directory.service')

    await expect(getOneOnOneGroups(42)).resolves.toEqual([])
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('excludes pp-enabled sections from cancelled (non-enrolled) batches', async () => {
    hoisted.getBatchIdsForEnrolledUser.mockResolvedValueOnce([2])
    hoisted.dbSelect
      .mockReturnValueOnce(
        chainSelect([
          {
            sectionId: 101,
            sectionName: 'Cancelled Section',
            batchId: 1,
            settings: {
              show_pp: true,
              ppLink: 'https://cal.example/cancelled',
            },
            managerId: null,
          },
          {
            sectionId: 202,
            sectionName: 'Active Section',
            batchId: 2,
            settings: { show_pp: true, ppLink: 'https://cal.example/active' },
            managerId: null,
          },
        ]),
      )
      .mockReturnValueOnce(chainSelect([]))
      .mockReturnValueOnce(
        chainSelect([{ id: 2, name: 'Active Batch', meta: { ppLink: null } }]),
      )

    const { getOneOnOneGroups } = await import('../directory.service')

    await expect(getOneOnOneGroups(42)).resolves.toEqual([
      {
        batchId: 2,
        batchName: 'Active Batch',
        batchPpLink: null,
        sections: [
          {
            sectionId: 202,
            sectionName: 'Active Section',
            ppLink: 'https://cal.example/active',
            coordinators: [],
          },
        ],
      },
    ])
  })
})
