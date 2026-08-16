import { afterEach, describe, expect, it } from 'vitest'
import {
  ensureAnthropicConfigured,
  getAiTutorChatModel,
  getAnthropicApiKey,
} from '@/server/api/ai-tutor/clients/anthropicModel'

const originalApiKey = process.env.ANTHROPIC_API_KEY
const originalModel = process.env.ANTHROPIC_MODEL
const originalOpenRouterApiKey = process.env.OPENROUTER_API_KEY
const originalOpenRouterModel = process.env.AI_TUTOR_OPENROUTER_MODEL

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

  if (originalOpenRouterApiKey === undefined) {
    delete process.env.OPENROUTER_API_KEY
  } else {
    process.env.OPENROUTER_API_KEY = originalOpenRouterApiKey
  }

  if (originalOpenRouterModel === undefined) {
    delete process.env.AI_TUTOR_OPENROUTER_MODEL
  } else {
    process.env.AI_TUTOR_OPENROUTER_MODEL = originalOpenRouterModel
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
  it('passes when the Anthropic API key is present', () => {
    delete process.env.OPENROUTER_API_KEY
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    expect(() => ensureAnthropicConfigured()).not.toThrow()
  })

  it('passes when only the OpenRouter fallback key is present', () => {
    delete process.env.ANTHROPIC_API_KEY
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    expect(() => ensureAnthropicConfigured()).not.toThrow()
  })

  it('throws when neither key is present', () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENROUTER_API_KEY
    expect(() => ensureAnthropicConfigured()).toThrow(
      expect.objectContaining({
        status: 503,
        code: 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED',
      }),
    )
  })
})

describe('getAiTutorChatModel', () => {
  it('uses ANTHROPIC_MODEL when set', () => {
    delete process.env.OPENROUTER_API_KEY
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    process.env.ANTHROPIC_MODEL = 'claude-opus-4-8'
    expect(getAiTutorChatModel()).toBeDefined()
  })

  it('prefers Anthropic over OpenRouter when both keys are present', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    const model = getAiTutorChatModel()
    expect(model.provider).toContain('anthropic')
  })

  it('falls back to OpenRouter when ANTHROPIC_API_KEY is not set', () => {
    delete process.env.ANTHROPIC_API_KEY
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    const model = getAiTutorChatModel()
    expect(model).toBeDefined()
    expect(model.modelId).toBe('anthropic/claude-haiku-4.5')
  })

  it('uses AI_TUTOR_OPENROUTER_MODEL to override the OpenRouter model id', () => {
    delete process.env.ANTHROPIC_API_KEY
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    process.env.AI_TUTOR_OPENROUTER_MODEL = 'anthropic/claude-opus-4.8'
    const model = getAiTutorChatModel()
    expect(model.modelId).toBe('anthropic/claude-opus-4.8')
  })

  it('throws when neither key is configured', () => {
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.OPENROUTER_API_KEY
    expect(() => getAiTutorChatModel()).toThrow(
      expect.objectContaining({
        status: 503,
        code: 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED',
      }),
    )
  })
})
