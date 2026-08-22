/**
 * Model variants under test, grouped by the two distinct OpenRouter calls the
 * interview feature makes (see src/server/api/interviews/constants.ts):
 * one audio-in/audio-out call for turn-by-turn decisions, one plain-text
 * call for question generation and report grading. Every id below was
 * checked against OpenRouter's live `/api/v1/models` catalog, not guessed.
 */

/**
 * Per-answer decision + spoken delivery (buildTurnSystemPrompt /
 * requestInterviewTurnAudioStream). Must support `modalities:
 * ['text','audio']` output AND tool-calling in the same call — on OpenRouter
 * today, only these two models qualify.
 */
export const TURN_DECISION_MODEL_VARIANTS = [
  'openai/gpt-audio-mini', // current INTERVIEW_AUDIO_MODEL default
  'openai/gpt-audio',
]

/**
 * Report grading + question generation (buildReportSystemPrompt /
 * buildQuestionsSystemPrompt). Plain text in/out, no audio, no tool-calling
 * required — three price/capability tiers of the current default's family.
 */
export const TEXT_GENERATION_MODEL_VARIANTS = [
  'openai/gpt-5.6-luna', // current INTERVIEW_REPORT_MODEL default
  'openai/gpt-5.6-terra',
  'openai/gpt-5.6-sol',
]

/**
 * Independent judge for LLM-graded scorers. Deliberately not a model from
 * either list above, so a model under test never grades its own family's
 * output. Override with EVAL_JUDGE_MODEL if you want a different judge.
 */
export const JUDGE_MODEL =
  process.env.EVAL_JUDGE_MODEL?.trim() || 'anthropic/claude-sonnet-5'
