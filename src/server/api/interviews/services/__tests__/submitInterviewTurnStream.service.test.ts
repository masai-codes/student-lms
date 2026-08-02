import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  row: null as any,
  requestInterviewAudioChatTurnStream: vi.fn(),
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
  requestInterviewAudioChatTurnStream:
    hoisted.requestInterviewAudioChatTurnStream,
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
    turns: [
      {
        index: 0,
        question: 'What is a hash map?',
        transcript: '',
        answerSource: 'voice',
        askedAt: '',
        answeredAt: '',
      },
    ],
    report: null,
    ...overrides,
  }
}

async function* fakeStream(
  events: Array<
    { type: 'delta'; text: string } | { type: 'result'; result: any }
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
  it('yields question-delta events then a done event when more questions remain', async () => {
    hoisted.row = baseRow()
    hoisted.requestInterviewAudioChatTurnStream.mockReturnValueOnce(
      fakeStream([
        { type: 'delta', text: 'How do you ' },
        { type: 'delta', text: 'handle collisions?' },
        {
          type: 'result',
          result: {
            transcript: 'A hash map maps keys to values.',
            nextQuestion: 'How do you handle collisions?',
          },
        },
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
      { type: 'question-delta', text: 'How do you ' },
      { type: 'question-delta', text: 'handle collisions?' },
    ])
    expect(events.at(-1)).toEqual({
      type: 'done',
      result: {
        status: 'in_progress',
        transcript: 'A hash map maps keys to values.',
        nextQuestion: 'How do you handle collisions?',
      },
    })
    const updatedTurns = hoisted.updateCalls[0].turns as Array<any>
    expect(updatedTurns).toHaveLength(2)
    expect(updatedTurns[1].question).toBe('How do you handle collisions?')
  })

  it('generates the report and completes the session on the final question', async () => {
    hoisted.row = baseRow({
      turns: [
        {
          index: 0,
          question: 'Q1?',
          transcript: 'A1',
          answerSource: 'voice',
          askedAt: '',
          answeredAt: '',
        },
        {
          index: 1,
          question: 'Q2?',
          transcript: '',
          answerSource: 'voice',
          askedAt: '',
          answeredAt: '',
        },
      ],
    })
    hoisted.requestInterviewAudioChatTurnStream.mockReturnValueOnce(
      fakeStream([
        {
          type: 'result',
          result: { transcript: 'Final answer', nextQuestion: null },
        },
      ]),
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

    expect(events).toEqual([
      {
        type: 'done',
        result: { status: 'completed', transcript: 'Final answer', report },
      },
    ])
    expect(hoisted.updateCalls[0].status).toBe('completed')
    expect(hoisted.updateCalls[0].report).toEqual(report)
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

  it('does not persist and throws INTERVIEW_TRANSCRIPT_EMPTY when transcription is empty', async () => {
    hoisted.row = baseRow()
    hoisted.requestInterviewAudioChatTurnStream.mockReturnValueOnce(
      fakeStream([
        {
          type: 'result',
          result: { transcript: '   ', nextQuestion: 'next?' },
        },
      ]),
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
    ).rejects.toMatchObject({ code: 'INTERVIEW_TRANSCRIPT_EMPTY' })
    expect(hoisted.updateCalls).toHaveLength(0)
  })
})
