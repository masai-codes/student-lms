import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  requestOpenRouterChatCompletion: vi.fn(),
}))

vi.mock('@/server/api/interviews/clients/openRouterClient', () => ({
  requestOpenRouterChatCompletion: hoisted.requestOpenRouterChatCompletion,
}))

import { generateAllInterviewQuestions } from '../generateInterviewQuestions.service'

beforeEach(() => {
  vi.clearAllMocks()
})

const baseInput = {
  topicLabel: 'DSA',
  domain: 'software-development',
  rubricFocus: ['Complexity', 'Correctness'],
  subtopics: ['Arrays', 'Linked Lists'],
  numQuestions: 3,
}

describe('generateAllInterviewQuestions', () => {
  it('parses numbered questions from the plain-text response', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      `1. Explain arrays.\n2. Explain linked lists.\n3. Compare their complexities.`,
    )

    await expect(generateAllInterviewQuestions(baseInput)).resolves.toEqual([
      'Explain arrays.',
      'Explain linked lists.',
      'Compare their complexities.',
    ])
  })

  it('strips numbering with either "." or ")" delimiters', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      `1) Explain arrays.\n2) Explain linked lists.\n3) Compare their complexities.`,
    )

    await expect(generateAllInterviewQuestions(baseInput)).resolves.toEqual([
      'Explain arrays.',
      'Explain linked lists.',
      'Compare their complexities.',
    ])
  })

  it('sends the report model and a system prompt built from the input', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      `1. Q1\n2. Q2\n3. Q3`,
    )
    await generateAllInterviewQuestions(baseInput)

    const call = hoisted.requestOpenRouterChatCompletion.mock.calls[0][0]
    expect(call.messages[0].role).toBe('system')
    expect(call.messages[0].content).toContain('DSA')
    expect(call.messages[0].content).toContain('Arrays, Linked Lists')
    expect(call.messages[1]).toEqual({
      role: 'user',
      content: 'Generate the questions now.',
    })
  })

  it('throws INTERVIEW_QUESTION_GENERATION_FAILED when the model call fails', async () => {
    hoisted.requestOpenRouterChatCompletion.mockRejectedValueOnce(
      new Error('boom'),
    )

    await expect(
      generateAllInterviewQuestions(baseInput),
    ).rejects.toMatchObject({ code: 'INTERVIEW_QUESTION_GENERATION_FAILED' })
  })

  it('throws INTERVIEW_QUESTION_GENERATION_FAILED when the wrong number of questions come back', async () => {
    hoisted.requestOpenRouterChatCompletion.mockResolvedValueOnce(
      `1. Only one question.`,
    )

    await expect(
      generateAllInterviewQuestions(baseInput),
    ).rejects.toMatchObject({ code: 'INTERVIEW_QUESTION_GENERATION_FAILED' })
  })
})
