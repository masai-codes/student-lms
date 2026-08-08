export { INTERVIEW_TOTAL_QUESTIONS } from '@/lib/interviews/interviewConstants'

/** Per-user per-day cap on new interview sessions — bounds model cost. */
export const INTERVIEW_DAILY_SESSION_LIMIT = 5

/** Max follow-up questions the interviewer may ask on a single planned
 * question before being forced to move on to the next one. */
export const INTERVIEW_MAX_FOLLOW_UPS = 4

// One OpenRouter-compatible audio model covers the opening greeting/question
// and every turn (audio-in/audio-out) — one OPENROUTER_API_KEY, no separate
// ANTHROPIC_API_KEY needed.
const DEFAULT_AUDIO_MODEL = 'openai/gpt-audio-mini'
const DEFAULT_MAX_ANSWER_SECONDS = 120

// Final report grading is a plain text-in/text-out call — gpt-audio-mini
// rejects requests with no audio anywhere in input or output ("This model
// requires that either input content or output modality contain audio"),
// which any all-typed/all-transcribed interview would trigger. A regular
// text model has no such constraint.
const DEFAULT_REPORT_MODEL = 'openai/gpt-5.6-luna'

/** 16kHz mono PCM16 WAV ≈ 32 KB/s; cap raw bytes with headroom over the seconds cap. */
const BYTES_PER_SECOND_16K_MONO_PCM16 = 32 * 1024

export function getInterviewAudioModel(): string {
  return process.env.INTERVIEW_AUDIO_MODEL?.trim() || DEFAULT_AUDIO_MODEL
}

export function getInterviewReportModel(): string {
  return process.env.INTERVIEW_REPORT_MODEL?.trim() || DEFAULT_REPORT_MODEL
}

export function getInterviewMaxAnswerSeconds(): number {
  const raw = process.env.INTERVIEW_MAX_ANSWER_SECONDS
  const parsed = raw ? Number(raw) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_ANSWER_SECONDS
}

export function getInterviewMaxAudioBytes(): number {
  // +25% headroom over the theoretical encode size for container/base64 slack.
  return Math.ceil(
    getInterviewMaxAnswerSeconds() * BYTES_PER_SECOND_16K_MONO_PCM16 * 1.25,
  )
}
