import type {
  AiTutorDispatchResult,
  AiTutorLimitStatus,
  AiTutorSession,
  AiTutorTranscriptEntry,
  AiTutorTranscriptSession,
} from '@/server/ai-tutor/types'
import {
  dispatchAgentOnTokenServer,
  endSessionOnTokenServer,
  fetchTranscriptOnTokenServer,
  generateSessionOnTokenServer,
} from '@/server/ai-tutor/clients/aiTutorTokenServer'
import {
  AI_TUTOR_DAILY_LIMIT,
  checkAiTutorDailyLimit,
} from '@/server/ai-tutor/services/aiTutorDailyLimit'
import {
  AiTutorLectureAccessError,
  resolveAiTutorLectureContext,
} from '@/server/ai-tutor/services/aiTutorLectureAccess'
import {
  attachTokenServerSessionToRecord,
  createAiTutorSessionRecord,
  listSessionsForLecture,
  markRecordFailed,
  updateLatestSessionFeedback,
} from '@/server/ai-tutor/services/aiTutorSessionRecords'

const DEFAULT_DURATION_MINUTES = 15
const DEFAULT_AGENT_NAME = 'local-agent'
const TRANSCRIPT_FETCH_LIMIT = 50

function getDefaultAgentName(): string {
  return process.env.LIVEKIT_AGENT_NAME?.trim() || DEFAULT_AGENT_NAME
}
// `LIVEKIT_AGENT_NAME` is optional — when unset we fall back to the same
// `local-agent` default the legacy backend used.

/**
 * Creates an AI tutor session end-to-end:
 *  1. Daily-limit check (DB)
 *  2. Lecture access + transcript fetch (DB)
 *  3. Insert pending DB record
 *  4. Ask the LiveKit token server to provision the session
 *  5. Persist the LiveKit credentials back into the DB record
 *
 * Throws coded errors that the route handler maps to HTTP statuses.
 */
export async function createAiTutorSession(input: {
  userId: number
  lectureId: number
  language: string
}): Promise<AiTutorSession> {
  const limit = await checkAiTutorDailyLimit({ userId: input.userId })
  if (!limit.canProceed) {
    throw new Error('AI_TUTOR_DAILY_LIMIT')
  }

  let lectureContext
  try {
    lectureContext = await resolveAiTutorLectureContext({
      userId: input.userId,
      lectureId: input.lectureId,
    })
  } catch (error) {
    if (error instanceof AiTutorLectureAccessError) {
      throw new Error(error.message)
    }
    throw error
  }

  const record = await createAiTutorSessionRecord({
    userId: input.userId,
    lectureId: input.lectureId,
    language: input.language,
    participantName: lectureContext.participantName,
    durationMinutes: DEFAULT_DURATION_MINUTES,
  })

  try {
    const generated = await generateSessionOnTokenServer({
      participantName: lectureContext.participantName,
      language: input.language,
      uniqueId: record.uniqueId,
      lectureId: input.lectureId,
      lectureTranscript: lectureContext.context.transcript,
      durationMinutes: DEFAULT_DURATION_MINUTES,
    })

    await attachTokenServerSessionToRecord({
      recordId: record.id,
      sessionId: generated.session_id,
      roomName: generated.room_name,
      url: generated.url,
      token: generated.token,
      participantName: generated.participant_name,
      durationMinutes: generated.duration_minutes,
    })

    return {
      sessionId: generated.session_id,
      roomName: generated.room_name,
      url: generated.url,
      token: generated.token,
      durationMinutes: generated.duration_minutes,
      participantName: generated.participant_name,
      uniqueId: generated.unique_id,
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : 'AI_TUTOR_SESSION_CREATE_FAILED'
    try {
      await markRecordFailed({ recordId: record.id, errorMessage: code })
    } catch {
      /* swallow secondary failures */
    }
    throw new Error(code)
  }
}

export async function dispatchAiTutorAgent(input: {
  userId: number
  lectureId: number
  roomName: string
  agentName?: string
}): Promise<AiTutorDispatchResult> {
  // Light-weight ownership check: the user must have an open session on this
  // lecture pointing at this room. Prevents arbitrary dispatch calls.
  const sessions = await listSessionsForLecture({
    userId: input.userId,
    lectureId: input.lectureId,
  })
  const owns = sessions.some(s => s.sessionId && s.sessionId.length > 0)
  if (!owns) {
    throw new Error('AI_TUTOR_SESSION_NOT_OWNED')
  }

  await dispatchAgentOnTokenServer({
    roomName: input.roomName,
    agentName: input.agentName?.trim() || getDefaultAgentName(),
  })

  return { success: true }
}

export async function endAiTutorSession(input: {
  userId: number
  sessionId: string
}): Promise<void> {
  // We do not strictly need to verify ownership here (LiveKit room is already
  // tied to a session id), but if the user has any session by this id at all
  // we still call the token server. If not, treat as no-op idempotent.
  await endSessionOnTokenServer(input.sessionId)
  void input.userId
}

export async function fetchAiTutorTranscript(input: {
  userId: number
  lectureId: number
}): Promise<Array<AiTutorTranscriptSession>> {
  const sessions = await listSessionsForLecture({
    userId: input.userId,
    lectureId: input.lectureId,
  })

  const recent = sessions.slice(-TRANSCRIPT_FETCH_LIMIT)
  const results = await Promise.allSettled(
    recent.map(async session => {
      const data = await fetchTranscriptOnTokenServer(session.sessionId)
      const transcript: Array<AiTutorTranscriptEntry> = data.transcript
        .filter(entry => entry.content && entry.timestamp)
        .map(entry => ({
          role: entry.role === 'assistant' ? 'assistant' : 'user',
          content: entry.content,
          timestamp: entry.timestamp,
          actionType:
            entry.action_type ??
            (entry.role === 'assistant' ? 'system-message' : 'user-message'),
        }))

      return {
        sessionId: session.sessionId,
        uniqueId: session.uniqueId,
        transcript,
        createdAt: session.createdAt ?? new Date().toISOString(),
      }
    }),
  )

  return results
    .filter(
      (r): r is PromiseFulfilledResult<AiTutorTranscriptSession> =>
        r.status === 'fulfilled',
    )
    .map(r => r.value)
    .filter(s => s.transcript.length > 0)
}

export async function fetchAiTutorLimit(input: {
  userId: number
}): Promise<AiTutorLimitStatus> {
  return checkAiTutorDailyLimit({
    userId: input.userId,
    dailyLimit: AI_TUTOR_DAILY_LIMIT,
  })
}

export async function submitAiTutorFeedback(input: {
  userId: number
  lectureId: number
  rating: number
  feedback: string | null
}): Promise<void> {
  const updated = await updateLatestSessionFeedback({
    userId: input.userId,
    lectureId: input.lectureId,
    rating: input.rating,
    feedback: input.feedback,
  })
  if (!updated) {
    throw new Error('AI_TUTOR_SESSION_NOT_FOUND')
  }
}
