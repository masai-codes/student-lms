export const CHATBOT_API = {
  sessions: (lectureId: number) => `/api/chatbot/${lectureId}/sessions`,
  session: (lectureId: number, sessionId: string) =>
    `/api/chatbot/${lectureId}/sessions/${sessionId}`,
  messages: (lectureId: number, sessionId: string) =>
    `/api/chatbot/${lectureId}/sessions/${sessionId}/messages`,
  token: (lectureId: number) => `/api/chatbot/${lectureId}/token`,
}

