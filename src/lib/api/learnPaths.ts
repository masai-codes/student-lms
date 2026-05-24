export const LEARN_API = {
  batches: '/api/learn/batches',
  batchData: '/api/learn/batch-data',
  lecture: (lectureId: number) => `/api/learn/lectures/${lectureId}`,
  assignment: (assignmentId: number) => `/api/learn/assignments/${assignmentId}`,
  resource: (resourceId: number) => `/api/learn/resources/${resourceId}`,
} as const
