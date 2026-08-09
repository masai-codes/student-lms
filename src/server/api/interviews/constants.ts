export { INTERVIEW_TOTAL_QUESTIONS } from '@/lib/interviews/interviewConstants'

/** Per-user per-day cap on new interview sessions — bounds model cost. */
export const INTERVIEW_DAILY_SESSION_LIMIT = 5

/** Soft floor — below this, the model decides freely whether to follow up or
 * move on. At and above this count the prompt nudges it to wrap up. */
export const INTERVIEW_MIN_FOLLOW_UPS = 3

/** Hard cap — the system force-advances once this many follow-ups have been
 * asked on a single planned question, regardless of what the model wants. */
export const INTERVIEW_MAX_FOLLOW_UPS = 5

// One OpenRouter-compatible audio model covers the opening greeting/question
// and every turn (audio-in/audio-out) — one OPENROUTER_API_KEY, no separate
// ANTHROPIC_API_KEY needed.
const DEFAULT_AUDIO_MODEL = 'openai/gpt-audio-mini'

// Final report grading is a plain text-in/text-out call — gpt-audio-mini
// rejects requests with no audio anywhere in input or output ("This model
// requires that either input content or output modality contain audio"),
// which any all-typed/all-transcribed interview would trigger. A regular
// text model has no such constraint.
const DEFAULT_REPORT_MODEL = 'openai/gpt-5.6-luna'

export function getInterviewAudioModel(): string {
  return process.env.INTERVIEW_AUDIO_MODEL?.trim() || DEFAULT_AUDIO_MODEL
}

export function getInterviewReportModel(): string {
  return process.env.INTERVIEW_REPORT_MODEL?.trim() || DEFAULT_REPORT_MODEL
}
