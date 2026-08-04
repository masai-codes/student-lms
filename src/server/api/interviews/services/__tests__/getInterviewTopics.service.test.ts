import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  domain: 'general',
  curriculumTopics: [] as Array<{ id: string; label: string }>,
}))

vi.mock('@/server/api/interviews/services/resolveInterviewDomain', () => ({
  resolveInterviewDomain: vi.fn(async () => hoisted.domain),
}))

vi.mock(
  '@/server/api/interviews/services/getCurriculumInterviewTopics.service',
  () => ({
    getCurriculumInterviewTopics: vi.fn(async () => hoisted.curriculumTopics),
  }),
)

describe('getInterviewTopicsForUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns catalog topics for the resolved domain plus curriculum topics', async () => {
    hoisted.domain = 'data-ai-ml'
    hoisted.curriculumTopics = [{ id: 'curriculum:pandas', label: 'Pandas' }]
    const { getInterviewTopicsForUser } =
      await import('../getInterviewTopics.service')

    const result = await getInterviewTopicsForUser(1)
    expect(result.domain).toBe('data-ai-ml')
    expect(result.catalogTopics.length).toBeGreaterThan(0)
    expect(
      result.catalogTopics.every((t) => t.id !== 'curriculum:pandas'),
    ).toBe(true)
    expect(result.curriculumTopics).toEqual(hoisted.curriculumTopics)
  })

  it('falls back to the general catalog when no batch is resolved, never empty', async () => {
    hoisted.domain = 'general'
    hoisted.curriculumTopics = []
    const { getInterviewTopicsForUser } =
      await import('../getInterviewTopics.service')

    const result = await getInterviewTopicsForUser(1)
    expect(result.domain).toBe('general')
    expect(result.catalogTopics.length).toBeGreaterThan(0)
    expect(result.curriculumTopics).toEqual([])
  })
})
