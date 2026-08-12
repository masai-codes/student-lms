import { fetchInterviewTopics } from '@/lib/api/interviews/interviewsApi'

export const INTERVIEW_TOPICS_QUERY_KEY = ['interview-topics'] as const

export const interviewTopicsQuery = () => ({
  queryKey: INTERVIEW_TOPICS_QUERY_KEY,
  queryFn: fetchInterviewTopics,
  staleTime: 5 * 60 * 1000,
})
