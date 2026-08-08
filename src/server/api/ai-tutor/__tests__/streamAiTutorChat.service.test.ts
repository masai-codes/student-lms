import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  streamText: vi.fn(),
  stepCountIs: vi.fn((count: number) => ({ type: 'stepCountIs', count })),
  findOrCreateChatPracticeRow: vi.fn(),
  appendChatPracticeHistory: vi.fn(),
  getLectureChatMaterials: vi.fn(),
}))

vi.mock('ai', () => ({
  streamText: hoisted.streamText,
  stepCountIs: hoisted.stepCountIs,
  tool: vi.fn((definition: unknown) => definition),
}))

vi.mock('@/server/api/ai-tutor/clients/anthropicModel', () => ({
  getAiTutorChatModel: vi.fn(() => 'mock-model'),
}))

vi.mock(
  '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service',
  () => ({
    findOrCreateChatPracticeRow: hoisted.findOrCreateChatPracticeRow,
    appendChatPracticeHistory: hoisted.appendChatPracticeHistory,
  }),
)

vi.mock(
  '@/server/api/ai-tutor/services/getLectureChatMaterials.service',
  () => ({
    getLectureChatMaterials: hoisted.getLectureChatMaterials,
  }),
)

vi.mock(
  '@/server/api/ai-tutor/services/getLectureChatMaterials.service',
  () => ({
    getLectureChatMaterials: hoisted.getLectureChatMaterials,
  }),
)

const materials = {
  lectureId: 99,
  title: 'Hooks Overview',
  summary: 'Lecture summary text',
  resourcesShared: [],
  notesRagged: true,
  notesInline: null,
  notesOutline: '- Hooks',
  notesCharacterCount: 24,
  ragRetrievalAvailable: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  hoisted.findOrCreateChatPracticeRow.mockResolvedValue({
    id: 12,
    chatHistory: [{ userMessage: 'Earlier', aiMessage: 'Sure' }],
  })
  hoisted.getLectureChatMaterials.mockResolvedValue(materials)
})

describe('prepareLectureChatContext', () => {
  it('loads chat materials and builds the prompt without upfront retrieval', async () => {
    const { prepareLectureChatContext } =
      await import('../streamAiTutorChat.service')

    const context = await prepareLectureChatContext({
      userId: 7,
      lectureId: 99,
      chat: 'Explain hooks',
      platform: 'web-desktop',
      language: 'English',
    })

    expect(hoisted.getLectureChatMaterials).toHaveBeenCalledWith(99)
    expect(context).toEqual({
      chatRow: {
        id: 12,
        chatHistory: [{ userMessage: 'Earlier', aiMessage: 'Sure' }],
      },
      materials,
      systemPrompt: expect.stringMatching(
        /Lecture summary text|- Hooks|You MUST respond ONLY in English/,
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
    expect(context.systemPrompt).toContain('retrieveLectureContent')
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
  it('streams tokens with the retrieve tool enabled', async () => {
    function* fullStream() {
      yield { type: 'text-delta', text: 'Hello ' }
      yield { type: 'text-delta', text: 'there' }
    }

    hoisted.streamText.mockReturnValueOnce({ fullStream: fullStream() })

    const { streamLectureChatEventsFromContext } =
      await import('../streamAiTutorChat.service')
    const events = []

    for await (const event of streamLectureChatEventsFromContext({
      chatRow: {
        id: 12,
        chatHistory: [{ userMessage: 'Earlier', aiMessage: 'Sure' }],
      },
      materials,
      systemPrompt: 'System prompt with lecture materials',
      messages: [
        { role: 'user', content: 'Earlier' },
        { role: 'assistant', content: 'Sure' },
        { role: 'user', content: 'Explain hooks' },
      ],
      chat: 'Explain hooks',
      platform: 'web-desktop',
      language: 'Hindi',
    })) {
      events.push(event)
    }

    expect(hoisted.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        system: 'System prompt with lecture materials',
        tools: expect.objectContaining({
          retrieveLectureContent: expect.objectContaining({
            inputSchema: expect.anything(),
          }),
          generatePracticeQuestions: expect.objectContaining({
            inputSchema: expect.anything(),
          }),
        }),
        stopWhen: { type: 'stepCountIs', count: 3 },
      }),
    )
    expect(hoisted.appendChatPracticeHistory).toHaveBeenCalledWith({
      rowId: 12,
      userMessage: 'Explain hooks',
      aiMessage: 'Hello there',
      platform: 'web-desktop',
      language: 'Hindi',
      existingHistory: [{ userMessage: 'Earlier', aiMessage: 'Sure' }],
      practiceQuestions: undefined,
    })
    expect(events).toEqual([
      { type: 'token', content: 'Hello ' },
      { type: 'token', content: 'there' },
      { type: 'done', chatId: 12 },
    ])
  })

  it('yields a practiceQuestions event and persists it when the tool is called', async () => {
    const payload = {
      topic: 'Hooks',
      questions: [
        {
          id: 'q1',
          question: 'What does useState return?',
          options: [
            { id: 'a', text: 'A tuple' },
            { id: 'b', text: 'An object' },
          ],
          correctOptionId: 'a',
        },
      ],
    }

    function* fullStream() {
      yield {
        type: 'tool-result',
        toolName: 'generatePracticeQuestions',
        output: payload,
      }
    }

    hoisted.streamText.mockReturnValueOnce({ fullStream: fullStream() })

    const { streamLectureChatEventsFromContext } =
      await import('../streamAiTutorChat.service')
    const events = []

    for await (const event of streamLectureChatEventsFromContext({
      chatRow: { id: 12, chatHistory: [] },
      materials,
      systemPrompt: 'Prompt',
      messages: [{ role: 'user', content: 'Give me practice questions' }],
      chat: 'Give me practice questions',
      platform: 'web-desktop',
      language: 'English',
    })) {
      events.push(event)
    }

    const namespacedPayload = {
      topic: 'Hooks',
      quizId: '12-t0',
      questions: [
        {
          id: '12-t0-q1',
          question: 'What does useState return?',
          options: [
            { id: '12-t0-q1-a', text: 'A tuple' },
            { id: '12-t0-q1-b', text: 'An object' },
          ],
          correctOptionId: '12-t0-q1-a',
        },
      ],
    }

    expect(events).toEqual([
      { type: 'practiceQuestions', payload: namespacedPayload },
      { type: 'done', chatId: 12 },
    ])
    expect(hoisted.appendChatPracticeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        aiMessage: '',
        practiceQuestions: namespacedPayload,
      }),
    )
  })

  it('always includes the practice-questions tool even when RAG retrieval is unavailable', async () => {
    function* fullStream() {
      yield { type: 'text-delta', text: 'Hi' }
    }

    hoisted.streamText.mockReturnValueOnce({ fullStream: fullStream() })

    const { streamLectureChatEventsFromContext } =
      await import('../streamAiTutorChat.service')

    for await (const _event of streamLectureChatEventsFromContext({
      chatRow: { id: 12, chatHistory: [] },
      materials: { ...materials, ragRetrievalAvailable: false },
      systemPrompt: 'Prompt',
      messages: [{ role: 'user', content: 'Explain hooks' }],
      chat: 'Explain hooks',
      platform: 'web',
      language: 'English',
    })) {
      // drain stream
    }

    const call = hoisted.streamText.mock.calls[0][0]
    expect(call.tools).not.toHaveProperty('retrieveLectureContent')
    expect(call.tools).toHaveProperty('generatePracticeQuestions')
  })
})
