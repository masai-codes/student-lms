import type {
  InterviewSession,
  InterviewSessionSummary,
  InterviewTopicsForUser,
} from '@/server/api/interviews/types/interviewSession'
import { fetchJson } from '@/lib/api/fetchJson'
import { INTERVIEWS_API } from '@/lib/api/interviews/interviewsPaths'

export async function fetchInterviewTopics(): Promise<InterviewTopicsForUser> {
  return fetchJson<InterviewTopicsForUser>(INTERVIEWS_API.topics)
}

export async function fetchInterviewSessions(): Promise<
  Array<InterviewSessionSummary>
> {
  return fetchJson<Array<InterviewSessionSummary>>(INTERVIEWS_API.sessions)
}

export async function fetchInterviewSession(
  sessionId: number | string,
): Promise<InterviewSession> {
  return fetchJson<InterviewSession>(INTERVIEWS_API.session(sessionId))
}

export type SubmitInterviewAnswerInput =
  | { kind: 'typed'; text: string }
  | { kind: 'transcribed'; text: string }

export type InterviewSttToken = {
  clientSecret: string
  /** Seconds from the time this response was issued until it expires. */
  expiresIn: number
}

export async function fetchInterviewSttToken(
  sessionId: number | string,
): Promise<InterviewSttToken> {
  return fetchJson<InterviewSttToken>(INTERVIEWS_API.sttToken(sessionId), {
    method: 'POST',
  })
}

export async function abandonInterviewSession(
  sessionId: number | string,
): Promise<void> {
  await fetchJson(INTERVIEWS_API.abandon(sessionId), { method: 'POST' })
}
