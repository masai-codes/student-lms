import { afterEach, describe, expect, it } from 'vitest'
import {
  getOpenAiApiKey,
  getOpenAiChatModel,
} from '@/server/ai-chat/clients/openAiChatModel'

const originalApiKey = process.env.OPENAI_API_KEY

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = originalApiKey
  }
})

describe('getOpenAiApiKey', () => {
  it('returns the trimmed API key when configured', () => {
    process.env.OPENAI_API_KEY = '  sk-test  '
    expect(getOpenAiApiKey()).toBe('sk-test')
  })

  it('throws AI_CHAT_OPENAI_NOT_CONFIGURED when the API key is missing', () => {
    delete process.env.OPENAI_API_KEY
    expect(() => getOpenAiApiKey()).toThrow('AI_CHAT_OPENAI_NOT_CONFIGURED')
  })
})

describe('getOpenAiChatModel', () => {
  it('builds a model for the default model id', () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    expect(getOpenAiChatModel()).toBeDefined()
  })

  it('builds a model for a custom model id', () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    expect(getOpenAiChatModel('gpt-4o-mini')).toBeDefined()
  })

  it('throws when the API key is missing', () => {
    delete process.env.OPENAI_API_KEY
    expect(() => getOpenAiChatModel()).toThrow('AI_CHAT_OPENAI_NOT_CONFIGURED')
  })
})
