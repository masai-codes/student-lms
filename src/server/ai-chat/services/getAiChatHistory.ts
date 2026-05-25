import type { AiChatMessage } from '@/server/ai-chat/types'
import type {
  AiTutorTranscriptEntry,
  AiTutorTranscriptSession,
} from '@/server/ai-tutor/types'

import { listAiChatMessages } from '@/server/ai-chat/services/aiChatMessages.repo'
import { fetchAiTutorTranscript } from '@/server/ai-tutor/services/aiTutorSession.service'

function dbRowToMessage(row: {
  id: number
  role: 'user' | 'assistant'
  content: string
  source: 'text' | 'voice'
  createdAt: string
}): AiChatMessage {
  const epoch = new Date(`${row.createdAt}Z`).getTime()
  return {
    id: `db-${row.id}`,
    role: row.role,
    content: row.content,
    source: row.source,
    timestamp: Number.isFinite(epoch) ? epoch : Date.now(),
  }
}

function voiceTranscriptEntryToMessage(
  entry: AiTutorTranscriptEntry,
  sessionId: string,
  index: number,
): AiChatMessage | null {
  if (!entry.content) return null
  const epoch = new Date(entry.timestamp).getTime()
  return {
    id: `voice-${sessionId}-${index}`,
    role: entry.role === 'assistant' ? 'assistant' : 'user',
    content: entry.content,
    source: 'voice',
    timestamp: Number.isFinite(epoch) ? epoch : Date.now(),
  }
}

function flattenVoiceSessions(
  sessions: ReadonlyArray<AiTutorTranscriptSession>,
): Array<AiChatMessage> {
  const out: Array<AiChatMessage> = []
  for (const session of sessions) {
    session.transcript.forEach((entry, index) => {
      const msg = voiceTranscriptEntryToMessage(entry, session.sessionId, index)
      if (msg) out.push(msg)
    })
  }
  return out
}

/**
 * Returns the unified chat timeline for one (user, lecture):
 *  - text messages persisted in our DB (typed via REST chat)
 *  - voice transcripts pulled from the LiveKit token server
 * merged and ordered ascending by timestamp.
 *
 * Voice transcripts remain on the Python agent today; if it's down we still
 * return the text history rather than failing the whole request.
 */
export async function getAiChatHistory(input: {
  userId: number
  lectureId: number
}): Promise<Array<AiChatMessage>> {
  const [textRows, voiceSessions] = await Promise.all([
    listAiChatMessages(input),
    fetchAiTutorTranscript(input).catch(() => [] as Array<AiTutorTranscriptSession>),
  ])

  const textMessages = textRows.map(dbRowToMessage)
  const voiceMessages = flattenVoiceSessions(voiceSessions)

  const merged = [...textMessages, ...voiceMessages]
  merged.sort((a, b) => a.timestamp - b.timestamp)
  return merged
}
