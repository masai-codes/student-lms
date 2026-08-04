import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as GetCurriculumInterviewTopicsService from '../getCurriculumInterviewTopics.service'

const hoisted = vi.hoisted(() => ({
  domain: 'software-development' as const,
  curriculumTopics: [] as Array<{
    id: string
    label: string
    rubricFocus: Array<string>
  }>,
}))

vi.mock('@/server/api/interviews/services/resolveInterviewDomain', () => ({
  resolveInterviewDomain: vi.fn(async () => hoisted.domain),
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
    const result = await resolveInterviewTopicSelection(1, 'dsa')
    expect(result.topicId).toBe('dsa')
    expect(result.domain).toBe('software-development')
    expect(result.rubricFocus.length).toBeGreaterThan(0)
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
        rubricFocus: ['Pandas fundamentals'],
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
