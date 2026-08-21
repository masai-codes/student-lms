/**
 * Mints a short-lived OpenAI Realtime "client secret" scoped to a
 * transcription-only session (`gpt-4o-mini-transcribe`). The browser uses
 * this secret to open a WebRTC connection directly to OpenAI — our server
 * never sees or proxies the actual audio, it only exchanges the standing
 * `OPENAI_API_KEY` for a token safe to hand to the client.
 * https://developers.openai.com/api/reference/resources/realtime/subresources/client_secrets
 */

import { ApiError, isApiError } from '@/server/api/http/apiError'
import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'

const OPENAI_CLIENT_SECRETS_URL =
  'https://api.openai.com/v1/realtime/client_secrets'
const DEFAULT_TIMEOUT_MS = 15_000

/** Long enough to cover connection setup + a full answer, short enough to bound blast radius if leaked. */
const CLIENT_SECRET_TTL_SECONDS = 300

const INTERVIEW_STT_TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe'

/**
 * ISO-639-1 hints for `gpt-4o-mini-transcribe` — passing the candidate's
 * chosen reply language measurably improves transcription accuracy for
 * non-English speech instead of leaving the model to guess. Only a subset of
 * `AiTutorChatLanguage` is listed here: the transcription API rejects
 * `language` values outside its own fixed support list. Verified live against
 * `POST /v1/realtime/client_secrets` — Punjabi, Odia, and Assamese are the
 * only offered languages actually rejected (400 `invalid_value`); everything
 * else below is confirmed accepted. Punjabi/Odia/Assamese are excluded from
 * the interview language picker entirely (see `interviewLanguages.ts`) rather
 * than sent with no hint. Hinglish has no ISO code of its own, so it's hinted
 * as Hindi — the model isn't forced to only output Hindi, just biased toward
 * it, which still helps for the Hindi-majority speech typical of Hinglish
 * answers.
 */
const STT_LANGUAGE_HINTS: Partial<Record<AiTutorChatLanguage, string>> = {
  English: 'en',
  Hindi: 'hi',
  Hinglish: 'hi',
  Tamil: 'ta',
  Telugu: 'te',
  Kannada: 'kn',
  Malayalam: 'ml',
  Bengali: 'bn',
  Marathi: 'mr',
  Gujarati: 'gu',
}

export type InterviewSttSession = {
  clientSecret: string
  /** Seconds from now until the secret expires — relative rather than an
   * absolute epoch, so the client doesn't need its clock in sync with ours
   * or OpenAI's to know when to mint a fresh one. */
  expiresIn: number
}

export async function requestInterviewSttClientSecret(
  language: AiTutorChatLanguage,
): Promise<InterviewSttSession> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new ApiError(503, 'INTERVIEW_OPENAI_NOT_CONFIGURED')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const response = await fetch(OPENAI_CLIENT_SECRETS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        session: {
          type: 'transcription',
          audio: {
            input: {
              transcription: {
                model: INTERVIEW_STT_TRANSCRIBE_MODEL,
                language: STT_LANGUAGE_HINTS[language],
              },
              // Silence and non-speech sounds (background noise, "mmm") are
              // the main trigger for the model hallucinating into an
              // unrelated language/script — gate transcription to detected
              // speech instead of transcribing continuously, and tell it
              // this is a close-talking mic (laptop/headset), not a room mic.
              turn_detection: { type: 'server_vad' },
              noise_reduction: { type: 'near_field' },
            },
          },
        },
        expires_after: {
          anchor: 'created_at',
          seconds: CLIENT_SECRET_TTL_SECONDS,
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      console.error(
        'OpenAI client_secrets request failed',
        response.status,
        await response.text().catch(() => ''),
      )
      throw new ApiError(503, 'INTERVIEW_OPENAI_REQUEST_FAILED')
    }

    const payload = (await response.json().catch(() => null)) as {
      value?: string
      expires_at?: number
    } | null

    if (!payload?.value) {
      throw new ApiError(503, 'INTERVIEW_OPENAI_INVALID_RESPONSE')
    }

    const expiresIn = payload.expires_at
      ? Math.max(0, payload.expires_at - Math.floor(Date.now() / 1000))
      : CLIENT_SECRET_TTL_SECONDS

    return { clientSecret: payload.value, expiresIn }
  } catch (error) {
    if (isApiError(error)) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(503, 'INTERVIEW_OPENAI_TIMEOUT')
    }
    throw new ApiError(503, 'INTERVIEW_OPENAI_REQUEST_FAILED')
  } finally {
    clearTimeout(timeout)
  }
}
