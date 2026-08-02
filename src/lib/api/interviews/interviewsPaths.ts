export const INTERVIEWS_API = {
  topics: '/api/interviews/topics',
  sessions: '/api/interviews/sessions',
  createSession: '/api/interviews/sessions',
  createSessionStream: '/api/interviews/sessions/stream',
  session: (sessionId: number | string) =>
    `/api/interviews/sessions/${sessionId}`,
  submitTurn: (sessionId: number | string) =>
    `/api/interviews/sessions/${sessionId}/turns`,
  submitTurnStream: (sessionId: number | string) =>
    `/api/interviews/sessions/${sessionId}/turns/stream`,
} as const
