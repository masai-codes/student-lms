import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as GetCurriculumInterviewTopicsService from '../getCurriculumInterviewTopics.service'

const hoisted = vi.hoisted(() => ({
  domains: ['backend'] as Array<string>,
  curriculumTopics: [] as Array<{
    id: string
    label: string
    domain: string
    rubricFocus: Array<string>
    subtopics: Array<string>
  }>,
}))

vi.mock('@/server/api/interviews/services/resolveInterviewDomain', () => ({
  resolveInterviewDomains: vi.fn(async () => hoisted.domains),
}))

vi.mock(
  '@/server/api/interviews/services/getCurriculumInterviewTopics.service',
  async () => {
    const actual = await vi.importActual<
      typeof GetCurriculumInterviewTopicsService
    >('../getCurriculumInterviewTopics.service')
    return {
      ...actual,
      getCurriculumInterviewTopics: vi.fn(async () => hoisted.curriculumTopics),
    }
  },
)

describe('resolveInterviewTopicSelection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resolves a valid catalog topic id', async () => {
    const { resolveInterviewTopicSelection } =
      await import('../resolveInterviewTopicSelection')
    const result = await resolveInterviewTopicSelection(1, 'backend-dsa')
    expect(result.topicId).toBe('backend-dsa')
    expect(result.domain).toBe('backend')
    expect(result.rubricFocus.length).toBeGreaterThan(0)
    expect(result.subtopics.length).toBeGreaterThan(0)
  })

  it('narrows subtopics to the requested subset when valid', async () => {
    const { resolveInterviewTopicSelection } =
      await import('../resolveInterviewTopicSelection')
    const result = await resolveInterviewTopicSelection(1, 'backend-dsa', [
      'Big-O time & space intuition',
      'Linear search',
    ])
    expect(result.subtopics).toEqual([
      'Big-O time & space intuition',
      'Linear search',
    ])
  })

  it("drops requested subtopics that are not actually the topic's own", async () => {
    const { resolveInterviewTopicSelection } =
      await import('../resolveInterviewTopicSelection')
    const result = await resolveInterviewTopicSelection(1, 'backend-dsa', [
      'Linear search',
      'Not a real subtopic',
    ])
    expect(result.subtopics).toEqual(['Linear search'])
  })

  it('falls back to the full subtopic list when the request matches nothing', async () => {
    const { resolveInterviewTopicSelection } =
      await import('../resolveInterviewTopicSelection')
    const full = await resolveInterviewTopicSelection(1, 'backend-dsa')
    const result = await resolveInterviewTopicSelection(1, 'backend-dsa', [
      'Not a real subtopic',
    ])
    expect(result.subtopics).toEqual(full.subtopics)
  })

  it('throws INTERVIEW_TOPIC_INVALID for an unknown catalog id', async () => {
    const { resolveInterviewTopicSelection } =
      await import('../resolveInterviewTopicSelection')
    await expect(
      resolveInterviewTopicSelection(1, 'not-a-real-topic'),
    ).rejects.toMatchObject({ code: 'INTERVIEW_TOPIC_INVALID' })
  })

  it('resolves a curriculum topic id owned by the user', async () => {
    hoisted.curriculumTopics = [
      {
        id: 'curriculum:pandas',
        label: 'Pandas',
        domain: 'data-science',
        rubricFocus: ['Pandas fundamentals'],
        subtopics: [],
      },
    ]
    const { resolveInterviewTopicSelection } =
      await import('../resolveInterviewTopicSelection')
    const result = await resolveInterviewTopicSelection(1, 'curriculum:pandas')
    expect(result.topicLabel).toBe('Pandas')
  })

  it('throws INTERVIEW_TOPIC_INVALID for a curriculum id not owned by the user', async () => {
    hoisted.curriculumTopics = []
    const { resolveInterviewTopicSelection } =
      await import('../resolveInterviewTopicSelection')
    await expect(
      resolveInterviewTopicSelection(1, 'curriculum:someone-elses-topic'),
    ).rejects.toMatchObject({ code: 'INTERVIEW_TOPIC_INVALID' })
  })
})
