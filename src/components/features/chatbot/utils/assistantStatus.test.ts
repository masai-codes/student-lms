import { describe, expect, it } from 'vitest'
import { getAssistantStatusLabel } from '@/components/features/chatbot/utils/assistantStatus'

const baseInput = {
  hasUserTurn: true,
  isConnecting: false,
  roomConnected: true,
  agentReady: true,
  pendingMessage: false,
  isSending: false,
  agentThinking: false,
  lastMessageRole: 'user' as const,
}

describe('getAssistantStatusLabel', () => {
  it('returns null when there is no user turn', () => {
    expect(getAssistantStatusLabel({ ...baseInput, hasUserTurn: false })).toBeNull()
  })

  it('returns connecting label while the room is not ready', () => {
    expect(
      getAssistantStatusLabel({ ...baseInput, isConnecting: true, roomConnected: false }),
    ).toBe('Connecting to assistant...')
    expect(
      getAssistantStatusLabel({ ...baseInput, roomConnected: false }),
    ).toBe('Connecting to assistant...')
  })

  it('returns starting label when the agent is not ready', () => {
    expect(
      getAssistantStatusLabel({ ...baseInput, agentReady: false }),
    ).toBe('Starting assistant...')
  })

  it('returns sending label for a pending first message', () => {
    expect(
      getAssistantStatusLabel({ ...baseInput, pendingMessage: true }),
    ).toBe('Sending...')
  })

  it('returns thinking label while waiting for a reply', () => {
    expect(getAssistantStatusLabel(baseInput)).toBe('Thinking...')
    expect(
      getAssistantStatusLabel({ ...baseInput, isSending: true, lastMessageRole: undefined }),
    ).toBe('Thinking...')
    expect(
      getAssistantStatusLabel({
        ...baseInput,
        agentThinking: true,
        lastMessageRole: 'assistant',
      }),
    ).toBeNull()
  })

  it('returns null after the assistant has replied', () => {
    expect(
      getAssistantStatusLabel({
        ...baseInput,
        lastMessageRole: 'assistant',
        agentThinking: false,
      }),
    ).toBeNull()
  })
})
