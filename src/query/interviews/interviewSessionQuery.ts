import { fetchInterviewSession } from '@/lib/api/interviews/interviewsApi'

export const interviewSessionQueryKey = (sessionId: number | string) =>
  ['interview-session', String(sessionId)] as const

export const interviewSessionQuery = (sessionId: number | string) => ({
  queryKey: interviewSessionQueryKey(sessionId),
  queryFn: () => fetchInterviewSession(sessionId),
  staleTime: 0,
})
