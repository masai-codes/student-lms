import { describe, expect, it } from 'vitest'
import {
  isAgentParticipant,
  selectVoiceSubtitle,
} from '@/components/features/chatbot/utils/voiceSubtitle'
import type { DisplayMessage } from '@/components/features/chatbot/types'

describe('isAgentParticipant', () => {
  it('returns false for the local participant', () => {
    expect(isAgentParticipant('student-1', 'student-1')).toBe(false)
  })

  it('returns true for agent-like identities', () => {
    expect(isAgentParticipant('chat-agent', 'student-1')).toBe(true)
    expect(isAgentParticipant('ai-tutor', 'student-1')).toBe(true)
  })
})

describe('selectVoiceSubtitle', () => {
  it('returns null for an empty timeline', () => {
    expect(selectVoiceSubtitle([])).toBeNull()
  })

  it('returns null when the last message is blank', () => {
    const messages: DisplayMessage[] = [
      { id: '1', role: 'assistant', content: 'Hello' },
      { id: '2', role: 'user', content: '   ' },
    ]

    expect(selectVoiceSubtitle(messages)).toBeNull()
  })

  it('shows the latest message in a multi-turn conversation', () => {
    const messages: DisplayMessage[] = [
      { id: 'a1', role: 'assistant', content: 'How can I help you today?' },
      { id: 'u1', role: 'user', content: 'hey can you tell me about something' },
      { id: 'a2', role: 'assistant', content: 'sure here is' },
    ]

    expect(selectVoiceSubtitle(messages)).toEqual({
      role: 'assistant',
      text: 'sure here is',
      streamId: 'a2',
    })
  })

  it('updates when the last message content changes in place', () => {
    const initial: DisplayMessage[] = [
      { id: 'u1', role: 'user', content: 'hey can you' },
    ]
    const updated: DisplayMessage[] = [
      { id: 'u1', role: 'user', content: 'hey can you tell me about something' },
    ]

    expect(selectVoiceSubtitle(initial)?.text).toBe('hey can you')
    expect(selectVoiceSubtitle(updated)?.text).toBe('hey can you tell me about something')
  })
})
