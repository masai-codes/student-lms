import { describe, expect, it, vi, beforeEach } from 'vitest'

const hoisted = vi.hoisted(() => ({
  requestOpenRouterReportJson: vi.fn(),
}))

vi.mock('@/server/api/interviews/clients/openRouterTextChat', () => ({
  requestOpenRouterReportJson: hoisted.requestOpenRouterReportJson,
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
      transcript: 'They are contiguous memory',
      answerSource: 'voice' as const,
      askedAt: '',
      answeredAt: '',
    },
  ],
}

describe('generateInterviewReport', () => {
  it('returns the generated report object', async () => {
    const report = {
      overallScore: 80,
      rubric: [{ dimension: 'Complexity', score: 80, comment: 'Good' }],
      strengths: ['Clear explanation'],
      improvements: ['More depth'],
      summary: 'Solid performance',
    }
    hoisted.requestOpenRouterReportJson.mockResolvedValueOnce(report)

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await expect(generateInterviewReport(baseInput)).resolves.toEqual(report)
  })

  it('throws INTERVIEW_REPORT_GENERATION_FAILED when the model call fails', async () => {
    hoisted.requestOpenRouterReportJson.mockRejectedValueOnce(new Error('boom'))

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await expect(generateInterviewReport(baseInput)).rejects.toMatchObject({
      code: 'INTERVIEW_REPORT_GENERATION_FAILED',
    })
  })

  it('throws INTERVIEW_REPORT_GENERATION_FAILED when the response fails schema validation', async () => {
    hoisted.requestOpenRouterReportJson.mockResolvedValueOnce({
      overallScore: 'not-a-number',
    })

    const { generateInterviewReport } =
      await import('../generateInterviewReport.service')
    await expect(generateInterviewReport(baseInput)).rejects.toMatchObject({
      code: 'INTERVIEW_REPORT_GENERATION_FAILED',
    })
  })
})
