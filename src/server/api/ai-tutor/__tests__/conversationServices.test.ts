import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  listChatPracticeConversations: vi.fn(),
  getChatPracticeConversation: vi.fn(),
}))

vi.mock(
  '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service',
  () => ({
    listChatPracticeConversations: hoisted.listChatPracticeConversations,
    getChatPracticeConversation: hoisted.getChatPracticeConversation,
  }),
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listAiTutorConversations', () => {
  it('maps rows to conversation summaries', async () => {
    hoisted.listChatPracticeConversations.mockResolvedValueOnce([
      {
        id: 4,
        chatHistory: [{ userMessage: 'Explain hooks', aiMessage: 'Sure' }],
        updatedAt: '2026-06-22 12:00:00',
      },
    ])

    const { listAiTutorConversations } =
      await import('../listAiTutorConversations.service')
    const result = await listAiTutorConversations({
      userId: 1,
      lectureId: 9,
    })

    expect(result).toEqual({
      conversations: [
        {
          chatId: 4,
          title: 'Explain hooks',
          updatedAt: '2026-06-22 12:00:00',
        },
      ],
    })
  })
})

describe('getAiTutorConversation', () => {
  it('maps stored history to chat turns', async () => {
    hoisted.getChatPracticeConversation.mockResolvedValueOnce({
      id: 8,
      chatHistory: [{ userMessage: 'Hi', aiMessage: 'Hello' }],
    })

    const { getAiTutorConversation } =
      await import('../getAiTutorConversation.service')
    const result = await getAiTutorConversation({ userId: 1, chatId: 8 })

    expect(result).toEqual({
      chatId: 8,
      chat: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ],
    })
  })
})
