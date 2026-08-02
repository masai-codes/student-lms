/**
 * Low-level OpenRouter `/chat/completions` caller shared by the audio turn
 * client and the text-only clients (opening question, report scoring).
 * OpenRouter fronts Anthropic (and other) models behind one OpenAI-compatible
 * endpoint, so a single `OPENROUTER_API_KEY` covers all three call sites —
 * no separate `ANTHROPIC_API_KEY` needed for this feature.
 */

export const OPENROUTER_CHAT_COMPLETIONS_URL =
  'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_TIMEOUT_MS = 45_000

export const OPENROUTER_KNOWN_ERROR_MESSAGES = new Set([
  'INTERVIEW_OPENROUTER_NOT_CONFIGURED',
  'INTERVIEW_OPENROUTER_REQUEST_FAILED',
  'INTERVIEW_OPENROUTER_EMPTY_RESPONSE',
  'INTERVIEW_OPENROUTER_INVALID_RESPONSE',
  'INTERVIEW_OPENROUTER_TIMEOUT',
])

export type OpenRouterContentPart =
  | { type: 'text'; text: string }
  | { type: 'input_audio'; input_audio: { data: string; format: 'wav' } }

export type OpenRouterChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<OpenRouterContentPart>
}

export type OpenRouterJsonSchemaFormat = {
  type: 'json_schema'
  json_schema: {
    name: string
    strict: true
    schema: Record<string, unknown>
  }
}

/** Posts to OpenRouter and returns the raw assistant message content string. */
export async function requestOpenRouterChatCompletion(input: {
  messages: Array<OpenRouterChatMessage>
  model: string
  responseFormat?: OpenRouterJsonSchemaFormat
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('INTERVIEW_OPENROUTER_NOT_CONFIGURED')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        ...(input.responseFormat
          ? { response_format: input.responseFormat }
          : {}),
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error('INTERVIEW_OPENROUTER_REQUEST_FAILED')
    }

    const payload = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string | null } }>
    } | null

    const content = payload?.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('INTERVIEW_OPENROUTER_EMPTY_RESPONSE')
    }

    return content
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('INTERVIEW_OPENROUTER_TIMEOUT')
    }
    if (
      error instanceof Error &&
      OPENROUTER_KNOWN_ERROR_MESSAGES.has(error.message)
    ) {
      throw error
    }
    throw new Error('INTERVIEW_OPENROUTER_REQUEST_FAILED')
  } finally {
    clearTimeout(timeout)
  }
}
