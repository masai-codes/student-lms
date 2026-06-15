import { describe, expect, it } from 'vitest'
import { buildPreSessionGreeting } from '@/components/features/chatbot/utils/preSessionGreeting'

describe('buildPreSessionGreeting', () => {
  it('uses the first name from a full name', () => {
    expect(buildPreSessionGreeting('Nitin Kumar')).toBe(
      'Hi Nitin! Ask me anything about the lecture.',
    )
  })

  it('falls back when the name is blank', () => {
    expect(buildPreSessionGreeting('   ')).toBe('Hi there! Ask me anything about the lecture.')
  })

  it('supports a custom lecture label', () => {
    expect(buildPreSessionGreeting('Nitin', 'the GenAI lecture')).toBe(
      'Hi Nitin! Ask me anything about the GenAI lecture.',
    )
  })
})
