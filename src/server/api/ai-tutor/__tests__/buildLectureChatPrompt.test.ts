import { describe, expect, it } from 'vitest'
import {
  AI_TUTOR_LECTURE_CHAT_DEFAULT_LANGUAGE_INSTRUCTION,
  AI_TUTOR_LECTURE_CHAT_RESPONSE_GUIDANCE,
  AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT,
  AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT_BASE,
  buildEnforcedChatLanguageInstruction,
} from '@/server/api/ai-tutor/constants'
import {
  buildLectureChatMessages,
  buildLectureChatSystemPrompt,
} from '@/server/api/ai-tutor/services/buildLectureChatPrompt'

describe('buildLectureChatSystemPrompt', () => {
  it('appends the lecture summary to the base system prompt', () => {
    expect(buildLectureChatSystemPrompt('Hooks let you reuse state.')).toBe(
      `${AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT_BASE}

${AI_TUTOR_LECTURE_CHAT_DEFAULT_LANGUAGE_INSTRUCTION}

${AI_TUTOR_LECTURE_CHAT_RESPONSE_GUIDANCE}

## Lecture content (summary)
Hooks let you reuse state.`,
    )
  })

  it('matches the legacy full prompt when language is omitted', () => {
    expect(buildLectureChatSystemPrompt('Hooks let you reuse state.')).toContain(
      AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT.split('## Lecture content')[0].trim(),
    )
  })

  it('enforces the provided language in the system prompt', () => {
    const prompt = buildLectureChatSystemPrompt('Summary text', 'Hindi')

    expect(prompt).toContain(buildEnforcedChatLanguageInstruction('Hindi'))
    expect(prompt).not.toContain('Start by asking which language they prefer')
    expect(prompt).toContain('## Lecture content (summary)\nSummary text')
  })
})

describe('buildLectureChatMessages', () => {
  it('returns only the current question when history is empty', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [],
        question: 'What is useState?',
      }),
    ).toEqual([{ role: 'user', content: 'What is useState?' }])
  })

  it('maps prior turns to user and assistant messages before the question', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [{ userMessage: 'Hi', aiMessage: 'Hello' }],
        question: 'Next question',
      }),
    ).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Next question' },
    ])
  })

  it('skips empty history entries', () => {
    expect(
      buildLectureChatMessages({
        chatHistory: [{ userMessage: '', aiMessage: 'Hello' }],
        question: 'Next question',
      }),
    ).toEqual([
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Next question' },
    ])
  })
})
