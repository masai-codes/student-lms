export const LEARN_API = {
  page: '/api/learn/page',
  lecture: (lectureId: number) => `/api/learn/lectures/${lectureId}`,
  assignment: (assignmentId: number) => `/api/learn/assignments/${assignmentId}`,
  resource: (resourceId: number) => `/api/learn/resources/${resourceId}`,
  aiTutorSession: (lectureId: number) =>
    `/api/learn/ai-tutor/${lectureId}/session`,
  aiTutorDispatch: (lectureId: number) =>
    `/api/learn/ai-tutor/${lectureId}/dispatch`,
  aiTutorTranscript: (lectureId: number) =>
    `/api/learn/ai-tutor/${lectureId}/transcript`,
  aiTutorFeedback: (lectureId: number) =>
    `/api/learn/ai-tutor/${lectureId}/feedback`,
  aiTutorLimit: '/api/learn/ai-tutor/limit',
  aiTutorEnd: '/api/learn/ai-tutor/end',
  aiChatSend: (lectureId: number) =>
    `/api/learn/ai-chat/${lectureId}/send`,
  aiChatHistory: (lectureId: number) =>
    `/api/learn/ai-chat/${lectureId}/history`,
} as const
