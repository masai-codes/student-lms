import { createOpenAI } from '@ai-sdk/openai'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
  }
  return apiKey
}

/**
 * OpenRouter fronts every model behind one OpenAI-compatible
 * `/chat/completions` endpoint, so the official OpenAI provider's
 * `createOpenAI({ baseURL })` talks to it directly — no separate OpenRouter
 * provider package needed for the plain text-in/text-out calls (report
 * grading, question generation). The audio-in/audio-out interview-turn call
 * stays on a raw fetch (see openRouterClient.ts) since that modality isn't
 * representable through the AI SDK's LanguageModel interface.
 */
export function getOpenRouterTextModel(modelId: string) {
  const provider = createOpenAI({
    apiKey: getOpenRouterApiKey(),
    baseURL: OPENROUTER_BASE_URL,
  })
  return provider(modelId)
}
