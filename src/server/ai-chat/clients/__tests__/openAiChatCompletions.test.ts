import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { requestOpenAiChatCompletion } from '../openAiChatCompletions'

const hoisted = vi.hoisted(() => ({
  generateText: vi.fn(),
  getOpenAiChatModel: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: hoisted.generateText,
}))
vi.mock('@/server/ai-chat/clients/openAiChatModel', () => ({
  getOpenAiChatModel: hoisted.getOpenAiChatModel,
}))

describe('requestOpenAiChatCompletion', () => {
  const originalTimeout = process.env.AI_CHAT_OPENAI_TIMEOUT_MS

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.AI_CHAT_OPENAI_TIMEOUT_MS
    hoisted.getOpenAiChatModel.mockReturnValue('mock-model')
  })

  afterEach(() => {
    if (originalTimeout === undefined)
      delete process.env.AI_CHAT_OPENAI_TIMEOUT_MS
    else process.env.AI_CHAT_OPENAI_TIMEOUT_MS = originalTimeout
  })

  const baseInput = {
    messages: [
      { role: 'system' as const, content: 's' },
      { role: 'user' as const, content: 'hi' },
    ],
  }

  it('returns the trimmed assistant content on success', async () => {
    hoisted.generateText.mockResolvedValue({ text: '  Hello!  ' })
    await expect(requestOpenAiChatCompletion(baseInput)).resolves.toBe('Hello!')
  })

  it('passes the model, messages, and temperature through to generateText', async () => {
    hoisted.generateText.mockResolvedValue({ text: 'ok' })
    await requestOpenAiChatCompletion(baseInput)

    expect(hoisted.getOpenAiChatModel).toHaveBeenCalledWith(undefined)
    expect(hoisted.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        messages: baseInput.messages,
        temperature: 0.4,
      }),
    )
  })

  it('uses the requested model override and temperature', async () => {
    hoisted.generateText.mockResolvedValue({ text: 'ok' })
    await requestOpenAiChatCompletion({
      ...baseInput,
      model: 'gpt-4o-mini',
      temperature: 0.9,
    })

    expect(hoisted.getOpenAiChatModel).toHaveBeenCalledWith('gpt-4o-mini')
    expect(hoisted.generateText).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.9 }),
    )
  })

  it('throws AI_CHAT_OPENAI_NOT_CONFIGURED without an API key', async () => {
    hoisted.getOpenAiChatModel.mockImplementation(() => {
      throw new Error('AI_CHAT_OPENAI_NOT_CONFIGURED')
    })
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_NOT_CONFIGURED',
    )
    expect(hoisted.generateText).not.toHaveBeenCalled()
  })

  it('throws AI_CHAT_OPENAI_EMPTY_RESPONSE when content is empty', async () => {
    hoisted.generateText.mockResolvedValue({ text: '   ' })
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_EMPTY_RESPONSE',
    )
  })

  it('wraps generic generateText failures as AI_CHAT_OPENAI_REQUEST_FAILED', async () => {
    hoisted.generateText.mockRejectedValue(new Error('network down'))
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_REQUEST_FAILED',
    )
  })

  it('throws AI_CHAT_OPENAI_TIMEOUT when the abort signal times out', async () => {
    hoisted.generateText.mockImplementation(() => {
      const err = new DOMException('The operation timed out.', 'TimeoutError')
      return Promise.reject(err)
    })
    await expect(requestOpenAiChatCompletion(baseInput)).rejects.toThrow(
      'AI_CHAT_OPENAI_TIMEOUT',
    )
  })

  it('honors AI_CHAT_OPENAI_TIMEOUT_MS as the abort signal timeout', async () => {
    process.env.AI_CHAT_OPENAI_TIMEOUT_MS = '5000'
    hoisted.generateText.mockResolvedValue({ text: 'ok' })
    await requestOpenAiChatCompletion(baseInput)

    const call = hoisted.generateText.mock.calls[0][0]
    expect(call.abortSignal).toBeInstanceOf(AbortSignal)
  })
})
