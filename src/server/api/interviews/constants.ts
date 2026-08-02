export { INTERVIEW_TOTAL_QUESTIONS } from '@/lib/interviews/interviewConstants'

/** Per-user per-day cap on new interview sessions — bounds model cost. */
export const INTERVIEW_DAILY_SESSION_LIMIT = 5

// One OpenRouter-compatible audio model covers everything now: the opening
// greeting/question, every turn (audio-in/audio-out), and final report
// grading over the raw per-turn audio — one OPENROUTER_API_KEY, no separate
// text model or ANTHROPIC_API_KEY needed.
const DEFAULT_AUDIO_MODEL = 'openai/gpt-audio-mini'
const DEFAULT_MAX_ANSWER_SECONDS = 120

/** 16kHz mono PCM16 WAV ≈ 32 KB/s; cap raw bytes with headroom over the seconds cap. */
const BYTES_PER_SECOND_16K_MONO_PCM16 = 32 * 1024

export function getInterviewAudioModel(): string {
  return process.env.INTERVIEW_AUDIO_MODEL?.trim() || DEFAULT_AUDIO_MODEL
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
