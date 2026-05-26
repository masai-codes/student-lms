import type { OpenAiChatMessage } from '@/server/ai-chat/services/buildChatPrompt'

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4.1-mini'
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
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('AI_CHAT_OPENAI_NOT_CONFIGURED')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), resolveTimeoutMs())

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: input.model ?? DEFAULT_MODEL,
        temperature: input.temperature ?? 0.4,
        messages: input.messages,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error('AI_CHAT_OPENAI_REQUEST_FAILED')
    }

    const payload = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string | null } }>
    } | null

    const content = payload?.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('AI_CHAT_OPENAI_EMPTY_RESPONSE')
    }

    return content
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI_CHAT_OPENAI_TIMEOUT')
    }
    if (
      error instanceof Error &&
      (error.message === 'AI_CHAT_OPENAI_NOT_CONFIGURED' ||
        error.message === 'AI_CHAT_OPENAI_REQUEST_FAILED' ||
        error.message === 'AI_CHAT_OPENAI_EMPTY_RESPONSE')
    ) {
      throw error
    }
    throw new Error('AI_CHAT_OPENAI_REQUEST_FAILED')
  } finally {
    clearTimeout(timeout)
  }
}
