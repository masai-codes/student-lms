import { describe, expect, it } from 'vitest'
import { AI_TUTOR_CONVERSATION_TITLE_MAX_LENGTH } from '@/server/api/ai-tutor/constants'
import {
  chatHistoryToTurns,
  deriveConversationTitle,
} from '@/server/api/ai-tutor/utils/chatTurns'

describe('deriveConversationTitle', () => {
  it('returns the default title when history is empty', () => {
    expect(deriveConversationTitle([])).toBe('New chat')
  })

  it('uses the first user message as the title', () => {
    expect(
      deriveConversationTitle([
        { userMessage: 'What is useState?', aiMessage: 'A React hook.' },
      ]),
    ).toBe('What is useState?')
  })

  it('truncates long titles', () => {
    const longMessage = 'a'.repeat(AI_TUTOR_CONVERSATION_TITLE_MAX_LENGTH + 10)
    expect(
      deriveConversationTitle([{ userMessage: longMessage, aiMessage: 'ok' }]),
    ).toBe(`${'a'.repeat(AI_TUTOR_CONVERSATION_TITLE_MAX_LENGTH - 1)}…`)
  })
})

describe('chatHistoryToTurns', () => {
  it('maps stored history to user and assistant turns in order', () => {
    expect(
      chatHistoryToTurns([
        { userMessage: 'Hi', aiMessage: 'Hello' },
        { userMessage: 'More', aiMessage: 'Sure' },
      ]),
    ).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'More' },
      { role: 'assistant', content: 'Sure' },
    ])
  })
})
