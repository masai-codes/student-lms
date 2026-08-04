/** Dev-only switch to try live STT (gpt-4o-mini-transcribe) instead of the
 * default audio-in/audio-out gpt-audio-mini flow — see .env.example. */
export const USE_LIVE_STT =
  import.meta.env.VITE_INTERVIEW_STT_PROVIDER === 'openai-transcribe'
