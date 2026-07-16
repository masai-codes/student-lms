/**
 * Maps server-emitted error codes for the AI tutor flow to short, user
 * friendly messages we can render inline in the chat panel.
 */
export function aiTutorErrorMessage(code: string | null): string | null {
  if (!code) return null

  switch (code) {
    case 'AI_TUTOR_TRANSCRIPT_UNAVAILABLE':
      return "AI Tutor isn't available for this lecture yet — the recording hasn't been processed."
    case 'AI_TUTOR_DAILY_LIMIT':
      return "You've used your AI Tutor sessions for today. Try again tomorrow."
    case 'AI_TUTOR_LECTURE_FORBIDDEN':
      return "You don't have access to this lecture's AI Tutor."
    case 'AI_TUTOR_LECTURE_NOT_FOUND':
      return 'This lecture could not be found.'
    case 'AI_TUTOR_SESSION_NOT_FOUND':
    case 'AI_TUTOR_SESSION_NOT_OWNED':
      return 'Your AI Tutor session has expired. Please reload the page.'
    case 'AI_TUTOR_TOKEN_SERVER_NOT_CONFIGURED':
    case 'AI_TUTOR_TOKEN_SERVER_TIMEOUT':
    case 'AI_TUTOR_TOKEN_SERVER_GENERATE_FAILED':
    case 'AI_TUTOR_TOKEN_SERVER_INVALID_RESPONSE':
    case 'AI_TUTOR_TOKEN_SERVER_DISPATCH_FAILED':
    case 'AI_TUTOR_TOKEN_SERVER_END_FAILED':
    case 'AI_TUTOR_TOKEN_SERVER_TRANSCRIPT_FAILED':
    case 'AI_TUTOR_SESSION_CREATE_FAILED':
    case 'AI_TUTOR_RECORD_INSERT_FAILED':
      return 'AI Tutor is temporarily unavailable. Please try again in a moment.'
    case 'UNAUTHORIZED':
      return 'Please sign in again to use AI Tutor.'
    default:
      return 'Something went wrong while contacting the AI Tutor.'
  }
}
