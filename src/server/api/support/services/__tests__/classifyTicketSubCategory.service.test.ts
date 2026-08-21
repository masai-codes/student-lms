import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  generateText: vi.fn(),
  getAiTutorChatModel: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: hoisted.generateText,
}))
vi.mock('@/server/api/ai-tutor/clients/anthropicModel', () => ({
  getAiTutorChatModel: hoisted.getAiTutorChatModel,
}))

describe('classifyTicketSubCategory', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' }
    delete process.env.SUPPORT_AI_SUBCATEGORY
    delete process.env.SUPPORT_AI_SUBCATEGORY_TIMEOUT_MS
    hoisted.getAiTutorChatModel.mockReturnValue('mock-model')
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns null for a blank message without calling the AI', async () => {
    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'lecture',
      message: '   ',
    })
    expect(result).toBeNull()
    expect(hoisted.generateText).not.toHaveBeenCalled()
  })

  it('returns null for a category with no taxonomy entry', async () => {
    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'support',
      message: 'need help',
    })
    expect(result).toBeNull()
    expect(hoisted.generateText).not.toHaveBeenCalled()
  })

  it('flat category: returns the AI-matched question verbatim', async () => {
    hoisted.generateText.mockResolvedValue({
      text: 'Unable to join live lecture',
    })

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'lecture',
      message: "I can't get into the live class right now",
    })

    expect(result).toEqual({
      subCategory: 'Unable to join live lecture',
      source: 'ai',
    })
    expect(hoisted.generateText).toHaveBeenCalledTimes(1)
    expect(hoisted.generateText).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'mock-model', temperature: 0 }),
    )
  })

  it('flat category: rejects a hallucinated answer not in the list', async () => {
    hoisted.generateText.mockResolvedValue({ text: 'Something made up' })

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'lecture',
      message: 'random message',
    })

    expect(result).toBeNull()
  })

  it('flat category: treats the NONE sentinel as no match', async () => {
    hoisted.generateText.mockResolvedValue({ text: 'NONE' })

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'lecture',
      message: 'totally unrelated message',
    })

    expect(result).toBeNull()
  })

  it('skips the AI call entirely when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'lecture',
      message: "I can't join the live class",
    })

    expect(result).toBeNull()
    expect(hoisted.generateText).not.toHaveBeenCalled()
  })

  it('skips the AI call when SUPPORT_AI_SUBCATEGORY is disabled', async () => {
    process.env.SUPPORT_AI_SUBCATEGORY = 'false'

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'lecture',
      message: "I can't join the live class",
    })

    expect(result).toBeNull()
    expect(hoisted.generateText).not.toHaveBeenCalled()
  })

  it('never throws — swallows a request failure and returns null', async () => {
    hoisted.generateText.mockRejectedValue(new Error('Anthropic down'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'lecture',
      message: "I can't join the live class",
    })

    expect(result).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  it('general_query: two-stage — picks the bucket, then the question within it', async () => {
    hoisted.generateText
      .mockResolvedValueOnce({ text: 'lms-and-platform-support' })
      .mockResolvedValueOnce({
        text: 'I want to update my profile details (phone, address, etc.)',
      })

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'general_query',
      message: 'I need to change my phone number on my profile',
    })

    expect(result).toEqual({
      subCategory: 'I want to update my profile details (phone, address, etc.)',
      source: 'ai',
    })
    expect(hoisted.generateText).toHaveBeenCalledTimes(2)

    const firstPrompt = hoisted.generateText.mock.calls[0][0].prompt as string
    expect(firstPrompt).toContain('lms-and-platform-support')
    expect(firstPrompt).not.toContain('Course / content is not visible')

    const secondPrompt = hoisted.generateText.mock.calls[1][0].prompt as string
    expect(secondPrompt).toContain(
      'I want to update my profile details (phone, address, etc.)',
    )
    expect(secondPrompt).not.toContain('lms-and-platform-support')
  })

  it('general_query: stops after stage 1 when no bucket matches', async () => {
    hoisted.generateText.mockResolvedValueOnce({ text: 'NONE' })

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'general_query',
      message: 'totally unrelated to anything',
    })

    expect(result).toBeNull()
    expect(hoisted.generateText).toHaveBeenCalledTimes(1)
  })

  it('general_query: skips stage 2 entirely for a single-question bucket', async () => {
    hoisted.generateText.mockResolvedValueOnce({ text: 'one-on-one-session' })

    const { classifyTicketSubCategory } =
      await import('../classifyTicketSubCategory.service')
    const result = await classifyTicketSubCategory({
      category: 'general_query',
      message: 'I want to book a 1:1 with my mentor',
    })

    expect(result).toEqual({
      subCategory: 'Request for a One-on-One Session',
      source: 'ai',
    })
    // Only the bucket-selection call — the single-item bucket never needs a
    // second round-trip, there's nothing to disambiguate.
    expect(hoisted.generateText).toHaveBeenCalledTimes(1)
  })
})
