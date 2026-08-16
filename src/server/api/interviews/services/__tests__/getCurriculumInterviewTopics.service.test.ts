import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  sectionIds: [] as Array<number>,
  moduleRows: [] as Array<{ module: string | null }>,
}))

vi.mock('@/server/batches/getSectionIdsForUser', () => ({
  getSectionIdsForUser: vi.fn(async () => hoisted.sectionIds),
}))

vi.mock('@/db', () => {
  const chain = {
    selectDistinct: () => chain,
    from: () => chain,
    where: () => Promise.resolve(hoisted.moduleRows),
  }
  return { db: chain }
})

const catalogTopics = [
  {
    id: 'system-design',
    label: 'System Design',
    iconKey: 'network',
    blurb: '',
    domain: 'backend' as const,
    rubricFocus: [],
    subtopics: [],
  },
]

describe('getCurriculumInterviewTopics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns an empty list when the user has no sections', async () => {
    hoisted.sectionIds = []
    const { getCurriculumInterviewTopics } =
      await import('../getCurriculumInterviewTopics.service')
    expect(
      await getCurriculumInterviewTopics(1, 'backend', catalogTopics),
    ).toEqual([])
  })

  it('maps distinct non-empty modules to curriculum topics', async () => {
    hoisted.sectionIds = [1]
    hoisted.moduleRows = [
      { module: 'Data Analysis' },
      { module: null },
      { module: '  ' },
    ]
    const { getCurriculumInterviewTopics, buildCurriculumTopicId } =
      await import('../getCurriculumInterviewTopics.service')

    const topics = await getCurriculumInterviewTopics(
      1,
      'backend',
      catalogTopics,
    )
    expect(topics).toEqual([
      expect.objectContaining({
        id: buildCurriculumTopicId('Data Analysis'),
        label: 'Data Analysis',
      }),
    ])
  })

  it('de-dupes against catalog topics by normalized label', async () => {
    hoisted.sectionIds = [1]
    hoisted.moduleRows = [
      { module: 'System Design' },
      { module: 'system design' },
    ]
    const { getCurriculumInterviewTopics } =
      await import('../getCurriculumInterviewTopics.service')

    expect(
      await getCurriculumInterviewTopics(1, 'backend', catalogTopics),
    ).toEqual([])
  })

  it('marks curriculum topic ids so they can be recognized later', async () => {
    const { buildCurriculumTopicId, isCurriculumTopicId } =
      await import('../getCurriculumInterviewTopics.service')
    const id = buildCurriculumTopicId('Data Analysis')
    expect(id).toBe('curriculum:data-analysis')
    expect(isCurriculumTopicId(id)).toBe(true)
    expect(isCurriculumTopicId('system-design')).toBe(false)
  })
})
