export const INTERVIEWS_API = {
  topics: '/api/interviews/topics',
  createSession: '/api/interviews/sessions',
  session: (sessionId: number | string) =>
    `/api/interviews/sessions/${sessionId}`,
  submitTurn: (sessionId: number | string) =>
    `/api/interviews/sessions/${sessionId}/turns`,
  submitTurnStream: (sessionId: number | string) =>
    `/api/interviews/sessions/${sessionId}/turns/stream`,
} as const
