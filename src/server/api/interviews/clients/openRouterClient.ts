/**
 * OpenRouter `/chat/completions` callers for the interview feature.
 *
 * The plain text-in/text-out calls (opening question generation, report
 * scoring) go through the Vercel AI SDK via `openRouterModel.ts`'s
 * OpenAI-compatible provider. The audio-in/audio-out turn call
 * (`requestOpenRouterAudioStream`) stays on a raw fetch below: it needs
 * `modalities: ['text','audio']`, base64 PCM16 audio deltas, and tool-call
 * deltas interleaved on the same stream, none of which the AI SDK's
 * `LanguageModel` interface represents today.
 */
import { generateText, streamText, type ModelMessage } from 'ai'
import { getOpenRouterTextModel } from '@/server/api/interviews/clients/openRouterModel'

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

/** The text-only callers below never send `input_audio` parts — only the raw
 * audio-stream path does — so this narrows to what the AI SDK's message
 * shape accepts and fails loudly if that assumption is ever violated. */
function toModelMessages(
  messages: Array<OpenRouterChatMessage>,
): Array<ModelMessage> {
  return messages.map((message) => {
    if (typeof message.content === 'string') {
      return { role: message.role, content: message.content }
    }
    const parts = message.content.map((part) => {
      if (part.type !== 'text') {
        throw new Error('INTERVIEW_OPENROUTER_REQUEST_FAILED')
      }
      return { type: 'text' as const, text: part.text }
    })
    return { role: message.role, content: parts } as ModelMessage
  })
}

function mapModelError(error: unknown): Error {
  if (
    error instanceof Error &&
    OPENROUTER_KNOWN_ERROR_MESSAGES.has(error.message)
  ) {
    return error
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new Error('INTERVIEW_OPENROUTER_TIMEOUT')
  }
  return new Error('INTERVIEW_OPENROUTER_REQUEST_FAILED')
}

/** Posts to OpenRouter and returns the assistant message content string. */
export async function requestOpenRouterChatCompletion(input: {
  messages: Array<OpenRouterChatMessage>
  model: string
}): Promise<string> {
  const model = getOpenRouterTextModel(input.model)

  let result
  try {
    result = await generateText({
      model,
      messages: toModelMessages(input.messages),
      abortSignal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  } catch (error) {
    throw mapModelError(error)
  }

  const content = result.text?.trim()
  if (!content) {
    throw new Error('INTERVIEW_OPENROUTER_EMPTY_RESPONSE')
  }

  return content
}

/**
 * Posts to OpenRouter with streaming enabled and yields assistant message
 * content deltas as they arrive.
 */
export async function* requestOpenRouterChatCompletionStream(input: {
  messages: Array<OpenRouterChatMessage>
  model: string
}): AsyncGenerator<string> {
  const model = getOpenRouterTextModel(input.model)

  let sawContent = false
  try {
    const result = streamText({
      model,
      messages: toModelMessages(input.messages),
      abortSignal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
    for await (const delta of result.textStream) {
      sawContent = true
      yield delta
    }
  } catch (error) {
    throw mapModelError(error)
  }

  if (!sawContent) {
    throw new Error('INTERVIEW_OPENROUTER_EMPTY_RESPONSE')
  }
}

/**
 * Shared POST + SSE-frame-parsing loop for the audio-delta stream below —
 * same auth/timeout/error handling as the AI-SDK-backed callers above, only
 * hand-rolled because the audio modality isn't representable through the AI
 * SDK's `LanguageModel` interface.
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

export type OpenRouterAudioStreamEvent =
  | { type: 'audio'; data: string }
  | { type: 'transcript'; text: string }
  | { type: 'tool_call'; name: string }

/** Minimal OpenAI-compatible function tool schema — this feature only ever
 * needs no-argument tools, so `parameters` is fixed to an empty object shape. */
export type OpenRouterTool = {
  type: 'function'
  function: { name: string; description: string; parameters: object }
}

/**
 * Posts to OpenRouter requesting spoken audio output (`modalities:
 * ['text','audio']` — OpenAI only accepts `['text']` or `['text','audio']`,
 * never `['audio']` alone — and audio output requires `stream: true`).
 * Yields the base64 PCM16 audio chunks, the accompanying spoken-text deltas,
 * and (when `tools` is passed and the model calls one) a `tool_call` event —
 * a given response is either spoken audio or a tool call, never both.
 */
export async function* requestOpenRouterAudioStream(input: {
  messages: Array<OpenRouterChatMessage>
  model: string
  voice: string
  format: 'pcm16'
  tools?: Array<OpenRouterTool>
}): AsyncGenerator<OpenRouterAudioStreamEvent> {
  for await (const raw of streamOpenRouterFrames(
    {
      model: input.model,
      messages: input.messages,
      modalities: ['text', 'audio'],
      audio: { voice: input.voice, format: input.format },
      stream: true,
      ...(input.tools ? { tools: input.tools } : {}),
    },
    extractAudioFrame,
  )) {
    const event = JSON.parse(raw) as OpenRouterAudioStreamEvent
    yield event
  }
}

/**
 * Audio deltas, transcript deltas, and tool-call deltas arrive as distinct
 * delta shapes on the same stream — re-serialize whichever is present as a
 * small tagged JSON string so it can flow through the shared string-yielding
 * frame loop above, then get parsed back into a typed event by the caller.
 * Tool-call names arrive whole in the delta that introduces them (arguments
 * stream separately after, but this feature's tools take no arguments, so
 * only the name is surfaced).
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
        delta?: {
          audio?: { data?: string; transcript?: string }
          tool_calls?: Array<{ function?: { name?: string } }>
        }
      }>
    }
  )?.choices?.[0]?.delta

  const toolName = delta?.tool_calls?.find((call) => call.function?.name)
    ?.function?.name
  if (typeof toolName === 'string' && toolName.length > 0) {
    return JSON.stringify({ type: 'tool_call', name: toolName })
  }

  if (typeof delta?.audio?.data === 'string' && delta.audio.data.length > 0) {
    return JSON.stringify({ type: 'audio', data: delta.audio.data })
  }
  if (
    typeof delta?.audio?.transcript === 'string' &&
    delta.audio.transcript.length > 0
  ) {
    return JSON.stringify({ type: 'transcript', text: delta.audio.transcript })
  }
  return null
}
