/**
 * Plain, env-free constants shared by both server (constants.ts) and client
 * (interview UI) code — safe to import from components, unlike
 * `@/server/api/interviews/constants` which reads `process.env`.
 */
export const INTERVIEW_TOTAL_QUESTIONS = 5

/** When true, submitting a voice answer sends whatever transcript has
 * accumulated so far immediately, tearing down the STT session in the
 * background instead of blocking on its final-segment commit — trades a
 * small chance of missing the last word or two for cutting several seconds
 * of perceived latency before the turn request even starts. */
export const INTERVIEW_SEND_PARTIAL_TRANSCRIPT_ON_SUBMIT = true
