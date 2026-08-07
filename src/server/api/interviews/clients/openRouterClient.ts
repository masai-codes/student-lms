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

/** Posts to OpenRouter and returns the raw assistant message content string. */
export async function requestOpenRouterChatCompletion(input: {
  messages: Array<OpenRouterChatMessage>
  model: string
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
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(
        'OpenRouter chat completion request failed',
        response.status,
        await response.text().catch(() => ''),
      )
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

/**
 * Shared POST + SSE-frame-parsing loop for both the text-delta stream and the
 * audio-delta stream below — same auth/timeout/error handling, only what's
 * extracted from each frame differs.
 */
async function* streamOpenRouterFrames(
  body: Record<string, unknown>,
  extract: (payload: string) => string | null,
): AsyncGenerator<string> {
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
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok || !response.body) {
      throw new Error('INTERVIEW_OPENROUTER_REQUEST_FAILED')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let sawContent = false

    let readResult = await reader.read()
    while (!readResult.done) {
      buffer += decoder.decode(readResult.value, { stream: true })

      let separatorIndex = buffer.indexOf('\n\n')
      while (separatorIndex !== -1) {
        const rawFrame = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)

        for (const line of rawFrame.split('\n')) {
          if (!line.startsWith('data:')) continue // skip SSE comments/keep-alives
          const payload = line.slice('data:'.length).replace(/^ /, '')
          const content = extract(payload)
          if (content) {
            sawContent = true
            yield content
          }
        }

        separatorIndex = buffer.indexOf('\n\n')
      }

      readResult = await reader.read()
    }

    if (!sawContent) {
      throw new Error('INTERVIEW_OPENROUTER_EMPTY_RESPONSE')
    }
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

function extractStreamedContent(payload: string): string | null {
  if (payload === '[DONE]') return null
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return null
  }
  const content = (
    parsed as { choices?: Array<{ delta?: { content?: string } }> }
  )?.choices?.[0]?.delta?.content
  return typeof content === 'string' && content.length > 0 ? content : null
}

/**
 * Posts to OpenRouter with `stream: true` and yields assistant message
 * content deltas as they arrive.
 */
export async function* requestOpenRouterChatCompletionStream(input: {
  messages: Array<OpenRouterChatMessage>
  model: string
}): AsyncGenerator<string> {
  yield* streamOpenRouterFrames(
    {
      model: input.model,
      messages: input.messages,
      stream: true,
    },
    extractStreamedContent,
  )
}

export type OpenRouterAudioStreamEvent =
  | { type: 'audio'; data: string }
  | { type: 'transcript'; text: string }

/**
 * Posts to OpenRouter requesting spoken audio output (`modalities:
 * ['text','audio']` — OpenAI only accepts `['text']` or `['text','audio']`,
 * never `['audio']` alone — and audio output requires `stream: true`).
 * Yields both the base64 PCM16 audio chunks and the accompanying spoken-text
 * deltas as they arrive; callers that only want the audio can filter.
 */
export async function* requestOpenRouterAudioStream(input: {
  messages: Array<OpenRouterChatMessage>
  model: string
  voice: string
  format: 'pcm16'
}): AsyncGenerator<OpenRouterAudioStreamEvent> {
  for await (const raw of streamOpenRouterFrames(
    {
      model: input.model,
      messages: input.messages,
      modalities: ['text', 'audio'],
      audio: { voice: input.voice, format: input.format },
      stream: true,
    },
    extractAudioFrame,
  )) {
    const event = JSON.parse(raw) as OpenRouterAudioStreamEvent
    yield event
  }
}

/**
 * Audio deltas and transcript deltas arrive as distinct delta shapes on the
 * same stream — re-serialize whichever is present as a small tagged JSON
 * string so it can flow through the shared string-yielding frame loop above,
 * then get parsed back into a typed event by the caller.
 */
function extractAudioFrame(payload: string): string | null {
  if (payload === '[DONE]') return null
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return null
  }
  const delta = (
    parsed as {
      choices?: Array<{
        delta?: { audio?: { data?: string; transcript?: string } }
      }>
    }
  )?.choices?.[0]?.delta?.audio

  if (typeof delta?.data === 'string' && delta.data.length > 0) {
    return JSON.stringify({ type: 'audio', data: delta.data })
  }
  if (typeof delta?.transcript === 'string' && delta.transcript.length > 0) {
    return JSON.stringify({ type: 'transcript', text: delta.transcript })
  }
  return null
}
