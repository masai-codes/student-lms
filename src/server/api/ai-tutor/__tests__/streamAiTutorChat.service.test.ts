import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  streamText: vi.fn(),
  findOrCreateChatPracticeRow: vi.fn(),
  appendChatPracticeHistory: vi.fn(),
  getLectureSummaryForChat: vi.fn(),
}))

vi.mock('ai', () => ({
  streamText: hoisted.streamText,
}))

vi.mock('@/server/api/ai-tutor/clients/anthropicModel', () => ({
  getAiTutorChatModel: vi.fn(() => 'mock-model'),
}))

vi.mock('@/server/api/ai-tutor/services/aiChatPracticeQuestions.service', () => ({
  findOrCreateChatPracticeRow: hoisted.findOrCreateChatPracticeRow,
  appendChatPracticeHistory: hoisted.appendChatPracticeHistory,
}))

vi.mock('@/server/api/ai-tutor/services/lecturesAi.service', () => ({
  getLectureSummaryForChat: hoisted.getLectureSummaryForChat,
}))

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.findOrCreateChatPracticeRow.mockResolvedValue({
    id: 12,
    chatHistory: [{ userMessage: 'Earlier', aiMessage: 'Sure' }],
  })
  hoisted.getLectureSummaryForChat.mockResolvedValue('Lecture summary text')
})

describe('prepareLectureChatContext', () => {
  it('loads chat row and builds the user prompt', async () => {
    const { prepareLectureChatContext } =
      await import('../streamAiTutorChat.service')

    const context = await prepareLectureChatContext({
      userId: 7,
      lectureId: 99,
      chat: 'Explain hooks',
      platform: 'web-desktop',
      language: 'English',
    })

    expect(hoisted.findOrCreateChatPracticeRow).toHaveBeenCalledWith({
      userId: 7,
      lectureId: 99,
      chatId: undefined,
    })
    expect(context).toEqual({
      chatRow: {
        id: 12,
        chatHistory: [{ userMessage: 'Earlier', aiMessage: 'Sure' }],
      },
      systemPrompt: expect.stringMatching(
        /Lecture summary text|You MUST respond ONLY in English/,
      ),
      messages: [
        { role: 'user', content: 'Earlier' },
        { role: 'assistant', content: 'Sure' },
        { role: 'user', content: 'Explain hooks' },
      ],
      chat: 'Explain hooks',
      platform: 'web-desktop',
      language: 'English',
    })
  })

  it('includes enforced language instructions when language is provided', async () => {
    const { prepareLectureChatContext } =
      await import('../streamAiTutorChat.service')

    const context = await prepareLectureChatContext({
      userId: 7,
      lectureId: 99,
      chat: 'Explain hooks',
      platform: 'web-desktop',
      language: 'Tamil',
    })

    expect(context.systemPrompt).toContain('You MUST respond ONLY in Tamil')
    expect(context.systemPrompt).not.toContain(
      'Start by asking which language they prefer',
    )
    expect(context.language).toBe('Tamil')
  })

  it('throws when the chat id is not found', async () => {
    const { ApiError } = await import('@/server/api/http/apiError')
    hoisted.findOrCreateChatPracticeRow.mockRejectedValueOnce(
      new ApiError(404, 'AI_TUTOR_CHAT_NOT_FOUND'),
    )

    const { prepareLectureChatContext } =
      await import('../streamAiTutorChat.service')

    await expect(
      prepareLectureChatContext({
        userId: 7,
        lectureId: 99,
        chat: 'Explain hooks',
        platform: 'web-desktop',
        chatId: 2,
        language: 'English',
      }),
    ).rejects.toMatchObject({ status: 404, code: 'AI_TUTOR_CHAT_NOT_FOUND' })
  })
})

describe('streamLectureChatEventsFromContext', () => {
  it('streams tokens, persists history, and returns chatId on done', async () => {
    function* textStream() {
      yield 'Hello '
      yield 'there'
    }

    hoisted.streamText.mockReturnValueOnce({ textStream: textStream() })

    const { streamLectureChatEventsFromContext } =
      await import('../streamAiTutorChat.service')
    const events = []

    for await (const event of streamLectureChatEventsFromContext({
      chatRow: {
        id: 12,
        chatHistory: [{ userMessage: 'Earlier', aiMessage: 'Sure' }],
      },
      systemPrompt: 'System prompt with lecture summary',
      messages: [
        { role: 'user', content: 'Earlier' },
        { role: 'assistant', content: 'Sure' },
        { role: 'user', content: 'Explain hooks' },
      ],
      chat: 'Explain hooks',
      platform: 'web',
      language: 'Hindi',
    })) {
      events.push(event)
    }

    expect(hoisted.findOrCreateChatPracticeRow).not.toHaveBeenCalled()
    expect(hoisted.getLectureSummaryForChat).not.toHaveBeenCalled()
    expect(hoisted.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        system: 'System prompt with lecture summary',
        messages: [
          { role: 'user', content: 'Earlier' },
          { role: 'assistant', content: 'Sure' },
          { role: 'user', content: 'Explain hooks' },
        ],
      }),
    )
    expect(hoisted.appendChatPracticeHistory).toHaveBeenCalledWith({
      rowId: 12,
      userMessage: 'Explain hooks',
      aiMessage: 'Hello there',
      platform: 'web',
      language: 'Hindi',
      existingHistory: [{ userMessage: 'Earlier', aiMessage: 'Sure' }],
    })
    expect(events).toEqual([
      { type: 'token', content: 'Hello ' },
      { type: 'token', content: 'there' },
      { type: 'done', chatId: 12 },
    ])
  })
})
