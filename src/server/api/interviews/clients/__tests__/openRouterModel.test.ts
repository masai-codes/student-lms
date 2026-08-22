import { afterEach, describe, expect, it } from 'vitest'
import {
  getOpenRouterApiKey,
  getOpenRouterTextModel,
} from '@/server/api/interviews/clients/openRouterModel'

const originalApiKey = process.env.OPENROUTER_API_KEY

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.OPENROUTER_API_KEY
  } else {
    process.env.OPENROUTER_API_KEY = originalApiKey
  }
})

describe('getOpenRouterApiKey', () => {
  it('returns the trimmed API key when configured', () => {
    process.env.OPENROUTER_API_KEY = '  sk-or-test  '
    expect(getOpenRouterApiKey()).toBe('sk-or-test')
  })

  it('throws INTERVIEW_OPENROUTER_NOT_CONFIGURED when the API key is missing', () => {
    delete process.env.OPENROUTER_API_KEY
    expect(() => getOpenRouterApiKey()).toThrow(
      'INTERVIEW_OPENROUTER_NOT_CONFIGURED',
    )
  })
})

describe('getOpenRouterTextModel', () => {
  it('builds a model for the given model id', () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test'
    expect(getOpenRouterTextModel('openai/gpt-5.6-luna')).toBeDefined()
  })

  it('throws when the API key is missing', () => {
    delete process.env.OPENROUTER_API_KEY
    expect(() => getOpenRouterTextModel('openai/gpt-5.6-luna')).toThrow(
      'INTERVIEW_OPENROUTER_NOT_CONFIGURED',
    )
  })
})
