import type { CreateInterviewSessionResult } from '@/server/api/interviews/services/interviewSession.service'
import type { SubmitInterviewTurnResult } from '@/server/api/interviews/services/submitInterviewTurn.service'
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

export async function createInterviewSession(
  topicId: string,
): Promise<CreateInterviewSessionResult> {
  return fetchJson<CreateInterviewSessionResult>(INTERVIEWS_API.createSession, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topicId }),
  })
}

export async function fetchInterviewSession(
  sessionId: number | string,
): Promise<InterviewSession> {
  return fetchJson<InterviewSession>(INTERVIEWS_API.session(sessionId))
}

export type SubmitInterviewAnswerInput =
  | { kind: 'audio'; blob: Blob }
  | { kind: 'typed'; text: string }
  | { kind: 'transcribed'; text: string }

export async function submitInterviewTurn(
  sessionId: number | string,
  answer: SubmitInterviewAnswerInput,
): Promise<SubmitInterviewTurnResult> {
  const form = new FormData()
  if (answer.kind === 'audio') {
    form.append('audio', answer.blob, 'answer.wav')
  } else if (answer.kind === 'transcribed') {
    form.append('transcribedAnswer', answer.text)
  } else {
    form.append('typedAnswer', answer.text)
  }

  return fetchJson<SubmitInterviewTurnResult>(
    INTERVIEWS_API.submitTurn(sessionId),
    { method: 'POST', body: form },
  )
}

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
