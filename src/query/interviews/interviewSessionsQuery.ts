import { fetchInterviewSessions } from '@/lib/api/interviews/interviewsApi'

const INTERVIEW_SESSIONS_QUERY_KEY = ['interview-sessions'] as const

export const interviewSessionsQuery = () => ({
  queryKey: INTERVIEW_SESSIONS_QUERY_KEY,
  queryFn: fetchInterviewSessions,
  staleTime: 30 * 1000,
})
