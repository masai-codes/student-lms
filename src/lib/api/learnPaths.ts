export const LEARN_API = {
  page: '/api/learn/page',
  lecture: (lectureId: number) => `/api/learn/lectures/${lectureId}`,
  lectureVideoProgress: (lectureId: number) =>
    `/api/learn/lectures/${lectureId}/video-progress`,
  lectureBookmark: (lectureId: number) =>
    `/api/learn/lectures/${lectureId}/bookmark`,
  lectureFeedback: (lectureId: number) =>
    `/api/learn/lectures/${lectureId}/feedback`,
  lectureZoomRedirect: (lectureId: number) =>
    `/api/learn/lectures/${lectureId}/zoom-redirect`,
  assignment: (assignmentId: number) => `/api/learn/assignments/${assignmentId}`,
  problem: (assignmentId: number, problemId: number) =>
    `/api/learn/assignments/${assignmentId}/problems/${problemId}`,
  resource: (resourceId: number) => `/api/learn/resources/${resourceId}`,
  resourceBookmark: (resourceId: number) =>
    `/api/learn/resources/${resourceId}/bookmark`,
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
  discussions: '/api/learn/discussions',
  discussionReplies: (discussionId: number) =>
    `/api/learn/discussions/${discussionId}/replies`,
} as const
