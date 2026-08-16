import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { ApiError } from '@/server/api/http/apiError'
import {
  AI_TUTOR_CHAT_DEFAULT_MODEL,
  AI_TUTOR_CHAT_OPENROUTER_DEFAULT_MODEL,
} from '@/server/api/ai-tutor/constants'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export function getAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    throw new ApiError(503, 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED')
  }
  return apiKey
}

/**
 * True when a direct Anthropic key is configured — callers use this to
 * choose between the Anthropic and OpenRouter-fallback paths without
 * triggering `getAnthropicApiKey`'s throw.
 */
export function hasAnthropicApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
}

export function getOpenRouterApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY?.trim() || undefined
}

/** Throws unless either a direct Anthropic key or an OpenRouter fallback key is configured. */
export function ensureAnthropicConfigured(): void {
  if (!hasAnthropicApiKey() && !getOpenRouterApiKey()) {
    throw new ApiError(503, 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED')
  }
}

/**
 * Prefers a direct Anthropic key. Falls back to the same Claude model via
 * OpenRouter's OpenAI-compatible endpoint when `ANTHROPIC_API_KEY` isn't
 * set but `OPENROUTER_API_KEY` is. Throws if neither is configured.
 */
export function getAiTutorChatModel() {
  if (hasAnthropicApiKey()) {
    const modelId =
      process.env.ANTHROPIC_MODEL?.trim() || AI_TUTOR_CHAT_DEFAULT_MODEL
    const provider = createAnthropic({ apiKey: getAnthropicApiKey() })
    return provider(modelId)
  }

  const openRouterApiKey = getOpenRouterApiKey()
  if (openRouterApiKey) {
    const modelId =
      process.env.AI_TUTOR_OPENROUTER_MODEL?.trim() ||
      AI_TUTOR_CHAT_OPENROUTER_DEFAULT_MODEL
    const provider = createOpenAI({
      apiKey: openRouterApiKey,
      baseURL: OPENROUTER_BASE_URL,
    })
    return provider(modelId)
  }

  throw new ApiError(503, 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED')
}
