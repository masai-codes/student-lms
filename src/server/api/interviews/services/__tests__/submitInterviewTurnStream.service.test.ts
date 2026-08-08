import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  row: null as any,
  requestInterviewTurnAudioStream: vi.fn(),
  requestOpenRouterChatCompletion: vi.fn(),
  generateInterviewReport: vi.fn(),
  updateCalls: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/db', () => {
  const chain: any = {
    update: () => chain,
    set: (values: Record<string, unknown>) => {
      hoisted.updateCalls.push(values)
      return chain
    },
    where: () => Promise.resolve(undefined),
  }
  return { db: chain }
})

vi.mock('@/server/api/interviews/services/interviewSession.service', () => ({
  getInterviewSessionRowForUser: vi.fn(async () => hoisted.row),
}))

vi.mock('@/server/api/interviews/clients/openRouterAudioChat', () => ({
  requestInterviewTurnAudioStream: hoisted.requestInterviewTurnAudioStream,
}))

vi.mock('@/server/api/interviews/clients/openRouterClient', () => ({
  requestOpenRouterChatCompletion: hoisted.requestOpenRouterChatCompletion,
}))

vi.mock(
  '@/server/api/interviews/services/generateInterviewReport.service',
  () => ({
    generateInterviewReport: hoisted.generateInterviewReport,
  }),
)

function baseRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 7,
    userId: 1,
    topicId: 'dsa',
    topicLabel: 'DSA',
    domain: 'software-development',
    status: 'in_progress',
    numQuestions: 5,
    turns: [
      {
        questionIndex: 0,
        turnKind: 'main',
        question: 'What is a hash map?',
        transcript: '',
        answerAudioBase64: null,
        answerSource: 'voice',
        askedAt: '',
        answeredAt: '',
      },
    ],
    report: null,
    ...overrides,
  }
}

async function* fakeAudioStream(
  events: Array<
    { type: 'audio'; data: string } | { type: 'final'; spokenText: string }
  >,
) {
  for (const event of events) yield event
}

async function collect(gen: AsyncGenerator<any>) {
  const events: Array<any> = []
  for await (const event of gen) events.push(event)
  return events
}

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.updateCalls = []
})

describe('submitInterviewTurnStream', () => {
  it('yields audio-delta events then a done event when more questions remain', async () => {
    hoisted.row = baseRow()
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      'ACTION: next_question\nTEXT: How do you handle collisions?',
    )
    hoisted.requestInterviewTurnAudioStream.mockReturnValueOnce(
      fakeAudioStream([
        { type: 'audio', data: 'QUJD' },
        { type: 'audio', data: 'REVG' },
      ]),
    )

    const { submitInterviewTurnStream } =
      await import('../submitInterviewTurn.service')
    const events = await collect(
      submitInterviewTurnStream({
        userId: 1,
        sessionId: 7,
        answer: { kind: 'typed', text: 'A hash map maps keys to values.' },
      }),
    )

    expect(events.slice(0, 2)).toEqual([
      { type: 'audio-delta', data: 'QUJD' },
      { type: 'audio-delta', data: 'REVG' },
    ])
    expect(events.at(-1)).toEqual({
      type: 'done',
      result: {
        status: 'in_progress',
        nextQuestion: 'How do you handle collisions?',
      },
    })
    const updatedTurns = hoisted.updateCalls[0].turns as Array<any>
    expect(updatedTurns).toHaveLength(2)
    expect(updatedTurns[1].question).toBe('How do you handle collisions?')
    expect(updatedTurns[1].questionIndex).toBe(1)
  })

  it('generates the report and completes the session when the decision ends the interview', async () => {
    const answeredPriorTurns = Array.from({ length: 4 }, (_, i) => ({
      questionIndex: i,
      turnKind: 'main' as const,
      question: `Q${i + 1}?`,
      transcript: `A${i + 1}`,
      answerAudioBase64: null,
      answerSource: 'typed' as const,
      askedAt: '',
      answeredAt: '2024-01-01T00:00:00.000Z',
    }))
    hoisted.row = baseRow({
      turns: [
        ...answeredPriorTurns,
        {
          questionIndex: 4,
          turnKind: 'main',
          question: 'Q5?',
          transcript: '',
          answerAudioBase64: null,
          answerSource: 'voice',
          askedAt: '',
          answeredAt: '',
        },
      ],
    })
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      'ACTION: end_interview\nTEXT: Thanks, that concludes the interview.',
    )
    hoisted.requestInterviewTurnAudioStream.mockReturnValueOnce(
      fakeAudioStream([{ type: 'audio', data: 'QUJD' }]),
    )
    const report = {
      overallScore: 90,
      rubric: [],
      strengths: [],
      improvements: [],
      summary: 'Great job',
    }
    hoisted.generateInterviewReport.mockResolvedValueOnce(report)

    const { submitInterviewTurnStream } =
      await import('../submitInterviewTurn.service')
    const events = await collect(
      submitInterviewTurnStream({
        userId: 1,
        sessionId: 7,
        answer: { kind: 'typed', text: 'Final answer' },
      }),
    )

    expect(events.at(-1)).toEqual({
      type: 'done',
      result: { status: 'completed', report },
    })
    expect(hoisted.updateCalls[0].status).toBe('completed')
    expect(hoisted.updateCalls[0].report).toEqual(report)
  })

  it('stores a transcribed answer as a voice turn with its transcript populated', async () => {
    hoisted.row = baseRow()
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      'ACTION: next_question\nTEXT: How do you handle collisions?',
    )
    hoisted.requestInterviewTurnAudioStream.mockReturnValueOnce(
      fakeAudioStream([{ type: 'audio', data: 'QUJD' }]),
    )

    const { submitInterviewTurnStream } =
      await import('../submitInterviewTurn.service')
    await collect(
      submitInterviewTurnStream({
        userId: 1,
        sessionId: 7,
        answer: {
          kind: 'transcribed',
          text: 'A hash map maps keys to values.',
        },
      }),
    )

    const updatedTurns = hoisted.updateCalls[0].turns as Array<any>
    expect(updatedTurns[0]).toMatchObject({
      transcript: 'A hash map maps keys to values.',
      answerAudioBase64: null,
      answerSource: 'voice',
    })
  })

  it('throws INTERVIEW_SESSION_NOT_IN_PROGRESS when the session is already completed', async () => {
    hoisted.row = baseRow({ status: 'completed' })

    const { submitInterviewTurnStream } =
      await import('../submitInterviewTurn.service')
    await expect(
      collect(
        submitInterviewTurnStream({
          userId: 1,
          sessionId: 7,
          answer: { kind: 'typed', text: 'x' },
        }),
      ),
    ).rejects.toMatchObject({ code: 'INTERVIEW_SESSION_NOT_IN_PROGRESS' })
  })

  it('does not persist and throws INTERVIEW_RESPONSE_EMPTY when the model has nothing to say', async () => {
    hoisted.row = baseRow()
    hoisted.requestInterviewTurnAudioStream.mockReturnValueOnce(
      fakeAudioStream([{ type: 'final', spokenText: '' }]),
    )

    const { submitInterviewTurnStream } =
      await import('../submitInterviewTurn.service')
    await expect(
      collect(
        submitInterviewTurnStream({
          userId: 1,
          sessionId: 7,
          answer: { kind: 'audio', base64: 'abc', format: 'wav' },
        }),
      ),
    ).rejects.toMatchObject({ code: 'INTERVIEW_RESPONSE_EMPTY' })
    expect(hoisted.updateCalls).toHaveLength(0)
  })
})
