import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GetBatchLearningDataInput } from '@/server/learn/types'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: hoisted.dbSelect,
  },
}))

describe('getBatchLearningData service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applies search + filters before pagination and returns filter values', async () => {
    const { getBatchLearningData } = await import('../services/getBatchLearningData.service')
    const input: GetBatchLearningDataInput = {
      batchId: 10,
      learningType: 'lecture',
      search: 'React',
      page: 1,
      pageSize: 1,
      filters: {
        categories: ['coding'],
        priorities: ['recommended'],
        instructors: ['Ananya Singh'],
      },
    }

    hoisted.dbSelect
      .mockReturnValueOnce({
        from: () => ({
          where: () =>
            Promise.resolve([
              { module: null, week: 1 },
              { module: 'Advanced', week: 2 },
            ]),
        }),
      })
      .mockReturnValueOnce({
        from: () => ({
          leftJoin: () => ({
            where: () => ({
              orderBy: () =>
                Promise.resolve([
                  {
                    id: 1,
                    title: 'React Intro',
                    category: 'coding',
                    type: 'live',
                    optional: 1,
                    schedule: '2026-05-10 10:00:00',
                    week: 1,
                    module: null,
                    hostName: 'Ananya Singh',
                  },
                  {
                    id: 2,
                    title: 'React DS',
                    category: 'coding',
                    type: 'live',
                    optional: 0,
                    schedule: '2026-05-09 10:00:00',
                    week: 1,
                    module: null,
                    hostName: 'Rohit Verma',
                  },
                ]),
            }),
          }),
        }),
      })

    const result = await getBatchLearningData(input)

    expect(result.learningItems).toEqual([
      {
        id: 1,
        learningType: 'lecture',
        title: 'React Intro',
        hostName: 'Ananya Singh',
        scheduleDate: '2026-05-10 10:00:00',
        type: 'live',
        category: 'coding',
        isOptional: 'recommended',
        moduleName: 'Module 1',
      },
    ])
    expect(result.filterValues).toEqual({
      moduleFilterValues: ['Advanced', 'Module 1'],
      categoryFilterValues: ['coding'],
      typeFilterValues: ['live'],
      priorityFilterValues: ['recommended'],
      instructorFilterValues: ['Ananya Singh'],
    })
    expect(result.pagination.totalItems).toBe(1)
    expect(result.pagination.pageSize).toBe(1)
  })
})
