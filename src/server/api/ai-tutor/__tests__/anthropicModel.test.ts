import { afterEach, describe, expect, it } from 'vitest'
import {
  ensureAnthropicConfigured,
  getAiTutorChatModel,
  getAnthropicApiKey,
} from '@/server/api/ai-tutor/clients/anthropicModel'

const originalApiKey = process.env.ANTHROPIC_API_KEY
const originalModel = process.env.ANTHROPIC_MODEL

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = originalApiKey
  }

  if (originalModel === undefined) {
    delete process.env.ANTHROPIC_MODEL
  } else {
    process.env.ANTHROPIC_MODEL = originalModel
  }
})

describe('getAnthropicApiKey', () => {
  it('returns the trimmed API key when configured', () => {
    process.env.ANTHROPIC_API_KEY = '  sk-test  '
    expect(getAnthropicApiKey()).toBe('sk-test')
  })

  it('throws when the API key is missing', () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(() => getAnthropicApiKey()).toThrow(
      expect.objectContaining({
        status: 503,
        code: 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED',
      }),
    )
  })
})

describe('ensureAnthropicConfigured', () => {
  it('passes when the API key is present', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    expect(() => ensureAnthropicConfigured()).not.toThrow()
  })
})

describe('getAiTutorChatModel', () => {
  it('uses ANTHROPIC_MODEL when set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    process.env.ANTHROPIC_MODEL = 'claude-opus-4-8'
    expect(getAiTutorChatModel()).toBeDefined()
  })
})
