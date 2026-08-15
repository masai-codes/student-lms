import { generateText } from 'ai'
import type { OpenAiChatMessage } from '@/server/ai-chat/services/buildChatPrompt'
import { getOpenAiChatModel } from '@/server/ai-chat/clients/openAiChatModel'

const DEFAULT_TIMEOUT_MS = 30_000

function resolveTimeoutMs(): number {
  const raw = process.env.AI_CHAT_OPENAI_TIMEOUT_MS
  const parsed = raw ? Number(raw) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS
}

export type RequestChatCompletionInput = {
  messages: Array<OpenAiChatMessage>
  model?: string
  temperature?: number
}

export async function requestOpenAiChatCompletion(
  input: RequestChatCompletionInput,
): Promise<string> {
  let result
  try {
    result = await generateText({
      model: getOpenAiChatModel(input.model),
      messages: input.messages,
      temperature: input.temperature ?? 0.4,
      abortSignal: AbortSignal.timeout(resolveTimeoutMs()),
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'AI_CHAT_OPENAI_NOT_CONFIGURED'
    ) {
      throw error
    }
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('AI_CHAT_OPENAI_TIMEOUT')
    }
    throw new Error('AI_CHAT_OPENAI_REQUEST_FAILED')
  }

  const content = result.text?.trim()
  if (!content) {
    throw new Error('AI_CHAT_OPENAI_EMPTY_RESPONSE')
  }

  return content
}
