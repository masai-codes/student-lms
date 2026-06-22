import { createAnthropic } from '@ai-sdk/anthropic'
import { ApiError } from '@/server/api/http/apiError'
import { AI_TUTOR_CHAT_DEFAULT_MODEL } from '@/server/api/ai-tutor/constants'

export function getAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    throw new ApiError(503, 'AI_TUTOR_ANTHROPIC_NOT_CONFIGURED')
  }
  return apiKey
}

export function ensureAnthropicConfigured(): void {
  getAnthropicApiKey()
}

export function getAiTutorChatModel() {
  const modelId =
    process.env.ANTHROPIC_MODEL?.trim() || AI_TUTOR_CHAT_DEFAULT_MODEL
  const provider = createAnthropic({ apiKey: getAnthropicApiKey() })
  return provider(modelId)
}
