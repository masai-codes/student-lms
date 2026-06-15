import { describe, expect, it } from 'vitest'

import { appendOptimisticMessages } from './optimisticMessages'

describe('appendOptimisticMessages', () => {
  it('returns messages unchanged when there are no optimistic entries', () => {
    const messages = [{ id: '1', role: 'user' as const, content: 'Hello' }]
    expect(appendOptimisticMessages(messages, [])).toEqual(messages)
  })

  it('appends optimistic user messages that are not already present', () => {
    const messages = [{ id: '1', role: 'assistant' as const, content: 'Hi there' }]
    const optimistic = [{ id: 'opt-1', role: 'user' as const, content: 'Hello' }]

    expect(appendOptimisticMessages(messages, optimistic)).toEqual([
      ...messages,
      ...optimistic,
    ])
  })

  it('skips optimistic messages that already exist in the transcript', () => {
    const messages = [{ id: '1', role: 'user' as const, content: 'Hello' }]
    const optimistic = [{ id: 'opt-1', role: 'user' as const, content: 'Hello' }]

    expect(appendOptimisticMessages(messages, optimistic)).toEqual(messages)
  })
})
