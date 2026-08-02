import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  selectResults: [] as Array<Array<Record<string, unknown>>>,
  insertResults: [] as Array<Array<{ insertId: number }>>,
  requestInterviewTurnAudioStream: vi.fn(),
  resolveInterviewTopicSelection: vi.fn(),
}))

vi.mock('@/db', () => {
  const chain: any = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    insert: () => chain,
    values: () => Promise.resolve(hoisted.insertResults.shift() ?? []),
    then: (resolve: any, reject: any) =>
      Promise.resolve(hoisted.selectResults.shift() ?? []).then(
        resolve,
        reject,
      ),
  }
  return { db: chain }
})

vi.mock('@/server/api/interviews/clients/openRouterAudioChat', () => ({
  requestInterviewTurnAudioStream: hoisted.requestInterviewTurnAudioStream,
}))

vi.mock(
  '@/server/api/interviews/services/resolveInterviewTopicSelection',
  () => ({
    resolveInterviewTopicSelection: hoisted.resolveInterviewTopicSelection,
  }),
)

async function* fakeAudioStream(
  events: Array<
    { type: 'audio'; data: string } | { type: 'final'; spokenText: string }
  >,
) {
  for (const event of events) yield event
}

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.selectResults = []
  hoisted.insertResults = []
  hoisted.resolveInterviewTopicSelection.mockResolvedValue({
    topicId: 'dsa',
    topicLabel: 'DSA',
    domain: 'software-development',
    rubricFocus: ['Complexity'],
  })
})

describe('createInterviewSession', () => {
  it('creates a session and returns the spoken greeting + first question', async () => {
    hoisted.selectResults = [[]] // under daily limit
    hoisted.insertResults = [[{ insertId: 7 }]]
    hoisted.requestInterviewTurnAudioStream.mockReturnValueOnce(
      fakeAudioStream([
        { type: 'audio', data: 'QUJD' },
        {
          type: 'final',
          spokenText:
            '  Hi, welcome! Today we’ll cover DSA. What is a hash map?  ',
        },
      ]),
    )

    const { createInterviewSession } =
      await import('../interviewSession.service')
    const result = await createInterviewSession(1, 'dsa')

    expect(result).toEqual({
      sessionId: 7,
      question: 'Hi, welcome! Today we’ll cover DSA. What is a hash map?',
    })
  })

  it('throws INTERVIEW_DAILY_LIMIT once the daily session cap is reached', async () => {
    hoisted.selectResults = [
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    ]

    const { createInterviewSession } =
      await import('../interviewSession.service')
    await expect(createInterviewSession(1, 'dsa')).rejects.toMatchObject({
      code: 'INTERVIEW_DAILY_LIMIT',
    })
  })

  it('throws INTERVIEW_QUESTION_GENERATION_FAILED when the model has nothing to say', async () => {
    hoisted.selectResults = [[]]
    hoisted.requestInterviewTurnAudioStream.mockReturnValueOnce(
      fakeAudioStream([{ type: 'final', spokenText: '   ' }]),
    )

    const { createInterviewSession } =
      await import('../interviewSession.service')
    await expect(createInterviewSession(1, 'dsa')).rejects.toMatchObject({
      code: 'INTERVIEW_QUESTION_GENERATION_FAILED',
    })
  })
})

describe('getInterviewSession', () => {
  it('returns the mapped session for its owner', async () => {
    hoisted.selectResults = [
      [
        {
          id: 7,
          userId: 1,
          topicId: 'dsa',
          topicLabel: 'DSA',
          domain: 'software-development',
          status: 'in_progress',
          turns: [],
          report: null,
          createdAt: null,
          updatedAt: null,
          completedAt: null,
        },
      ],
    ]

    const { getInterviewSession } = await import('../interviewSession.service')
    const result = await getInterviewSession(1, 7)
    expect(result.id).toBe(7)
    expect(result.topicLabel).toBe('DSA')
  })

  it('throws INTERVIEW_SESSION_NOT_FOUND when no row exists', async () => {
    hoisted.selectResults = [[]]
    const { getInterviewSession } = await import('../interviewSession.service')
    await expect(getInterviewSession(1, 999)).rejects.toMatchObject({
      code: 'INTERVIEW_SESSION_NOT_FOUND',
    })
  })

  it('throws INTERVIEW_SESSION_FORBIDDEN when the session belongs to another user', async () => {
    hoisted.selectResults = [[{ id: 7, userId: 2, turns: [], report: null }]]
    const { getInterviewSession } = await import('../interviewSession.service')
    await expect(getInterviewSession(1, 7)).rejects.toMatchObject({
      code: 'INTERVIEW_SESSION_FORBIDDEN',
    })
  })
})
