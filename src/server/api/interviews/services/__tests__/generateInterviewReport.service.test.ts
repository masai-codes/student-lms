import { describe, expect, it, vi, beforeEach } from 'vitest'

const hoisted = vi.hoisted(() => ({
  requestOpenRouterChatCompletion: vi.fn(),
}))

vi.mock('@/server/api/interviews/clients/openRouterClient', () => ({
  requestOpenRouterChatCompletion: hoisted.requestOpenRouterChatCompletion,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const baseInput = {
  topicLabel: 'DSA',
  domain: 'software-development',
  rubricFocus: ['Complexity'],
  turns: [
    {
      index: 0,
      question: 'Explain arrays',
      transcript: '',
      answerAudioBase64: 'BASE64WAV',
      answerSource: 'voice' as const,
      askedAt: '',
      answeredAt: '2024-01-01T00:00:00.000Z',
    },
  ],
}

const VALID_REPORT_TEXT = `OVERALL_SCORE: 80
SUMMARY: Solid performance overall.
STRENGTHS:
- Clear explanation
IMPROVEMENTS:
- More depth
RUBRIC:
- dimension: Complexity | score: 80 | comment: Good`

describe('generateInterviewReport', () => {
  it('returns the generated report object parsed from the plain-text response', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      VALID_REPORT_TEXT,
    )

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await expect(generateInterviewReport(baseInput)).resolves.toEqual({
      overallScore: 80,
      rubric: [{ dimension: 'Complexity', score: 80, comment: 'Good' }],
      strengths: ['Clear explanation'],
      improvements: ['More depth'],
      summary: 'Solid performance overall.',
    })
  })

  it('tolerates a rubric line missing the dimension: key prefix', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      `OVERALL_SCORE: 80
SUMMARY: Solid.
STRENGTHS:
- Clear explanation
IMPROVEMENTS:
- More depth
RUBRIC:
- Complexity | score: 80 | comment: Good`,
    )

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await expect(generateInterviewReport(baseInput)).resolves.toEqual({
      overallScore: 80,
      rubric: [{ dimension: 'Complexity', score: 80, comment: 'Good' }],
      strengths: ['Clear explanation'],
      improvements: ['More depth'],
      summary: 'Solid.',
    })
  })

  it('sends a placeholder for voice-answered turns with no transcript, since the report model is text-only', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      VALID_REPORT_TEXT,
    )

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await generateInterviewReport(baseInput)

    const call = hoisted.requestOpenRouterChatCompletion.mock.calls[0][0]
    const userMessage = call.messages.find((m: any) => m.role === 'user')
    expect(userMessage.content).toEqual([
      {
        type: 'text',
        text: '[Voice answer submitted — no transcript available]',
      },
    ])
  })

  it('sends the transcript as text for a transcribed voice turn', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      VALID_REPORT_TEXT,
    )

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await generateInterviewReport({
      ...baseInput,
      turns: [
        {
          ...baseInput.turns[0],
          transcript: 'Arrays are contiguous memory blocks.',
        },
      ],
    })

    const call = hoisted.requestOpenRouterChatCompletion.mock.calls[0][0]
    const userMessage = call.messages.find((m: any) => m.role === 'user')
    expect(userMessage.content).toEqual([
      { type: 'text', text: 'Arrays are contiguous memory blocks.' },
    ])
  })

  it('throws INTERVIEW_REPORT_GENERATION_FAILED when the model call fails', async () => {
    hoisted.requestOpenRouterChatCompletion.mockRejectedValueOnce(
      new Error('boom'),
    )

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await expect(generateInterviewReport(baseInput)).rejects.toMatchObject({
      code: 'INTERVIEW_REPORT_GENERATION_FAILED',
    })
  })

  it('throws INTERVIEW_REPORT_GENERATION_FAILED when the response fails schema validation', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      'garbage response with no recognizable sections',
    )

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await expect(generateInterviewReport(baseInput)).rejects.toMatchObject({
      code: 'INTERVIEW_REPORT_GENERATION_FAILED',
    })
  })
})
