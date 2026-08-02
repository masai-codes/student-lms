export const INTERVIEWS_API = {
  topics: '/api/interviews/topics',
  createSession: '/api/interviews/sessions',
  session: (sessionId: number | string) =>
    `/api/interviews/sessions/${sessionId}`,
  submitTurn: (sessionId: number | string) =>
    `/api/interviews/sessions/${sessionId}/turns`,
} as const
