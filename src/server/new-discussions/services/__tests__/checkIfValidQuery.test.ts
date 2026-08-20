import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  generateObject: vi.fn(),
  getOpenAiChatModel: vi.fn(),
}))

vi.mock('ai', () => ({
  generateObject: hoisted.generateObject,
}))
vi.mock('@/server/ai-chat/clients/openAiChatModel', () => ({
  getOpenAiChatModel: hoisted.getOpenAiChatModel,
}))

import { checkIfValidQuery } from '../checkIfValidQuery'

describe('checkIfValidQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.getOpenAiChatModel.mockReturnValue('mock-model')
  })

  it('returns true when classifier says CURRICULUM_RELATED', async () => {
    hoisted.generateObject.mockResolvedValue({
      object: { classification: 'CURRICULUM_RELATED' },
    })
    await expect(
      checkIfValidQuery('How do I solve this React useEffect bug?'),
    ).resolves.toBe(true)
  })

  it('returns false when classifier says NON_CURRICULUM', async () => {
    hoisted.generateObject.mockResolvedValue({
      object: { classification: 'NON_CURRICULUM' },
    })
    await expect(checkIfValidQuery('which phone should I buy?')).resolves.toBe(
      false,
    )
  })

  it('returns false when the model call throws', async () => {
    hoisted.generateObject.mockRejectedValue(new Error('network down'))
    await expect(checkIfValidQuery('anything')).resolves.toBe(false)
  })

  it('returns false when the API key is missing', async () => {
    hoisted.getOpenAiChatModel.mockImplementation(() => {
      throw new Error('AI_CHAT_OPENAI_NOT_CONFIGURED')
    })
    await expect(checkIfValidQuery('anything')).resolves.toBe(false)
    expect(hoisted.generateObject).not.toHaveBeenCalled()
  })

  it('returns false when the response fails schema validation', async () => {
    hoisted.generateObject.mockRejectedValue(
      new Error('response did not match schema'),
    )
    await expect(checkIfValidQuery('anything')).resolves.toBe(false)
  })

  it('passes the query as the prompt and the shared OpenAI model', async () => {
    hoisted.generateObject.mockResolvedValue({
      object: { classification: 'NON_CURRICULUM' },
    })
    await checkIfValidQuery('hello')

    expect(hoisted.generateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        prompt: 'hello',
      }),
    )
  })
})
