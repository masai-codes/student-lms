import { createOpenAI } from '@ai-sdk/openai'

export const AI_CHAT_OPENAI_DEFAULT_MODEL = 'gpt-4.1-mini'

export function getOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('AI_CHAT_OPENAI_NOT_CONFIGURED')
  }
  return apiKey
}

/** Shared OpenAI model getter for the ai-chat and new-discussions features. */
export function getOpenAiChatModel(modelId?: string) {
  const provider = createOpenAI({ apiKey: getOpenAiApiKey() })
  return provider(modelId ?? AI_CHAT_OPENAI_DEFAULT_MODEL)
}
