export const COURSE_API = {
  primary: (batchId: number) => `/api/course/${batchId}`,
  details: (batchId: number) => `/api/course/${batchId}/details`,
} as const
