import type {
  AiChatAudioAssistantEntry,
  AiChatAudioStudentEntry,
  AiChatHistoryEntry,
} from '@/server/ai-chat/types'
import type { TokenServerTranscriptEntry } from '@/server/ai-tutor/clients/aiTutorTokenServer'

import {
  appendChatHistoryEntries,
  loadOrCreateChatRow,
} from '@/server/ai-chat/services/aiChatPracticeQuestions.repo'
import { fetchTranscriptOnTokenServer } from '@/server/ai-tutor/clients/aiTutorTokenServer'

/**
 * Pulls the final transcript for a just-ended LiveKit session and appends
 * each turn into the persisted `chatHistory` JSON as `audio_chat_*` entries.
 *
 * Voice and text share one row per (user, lecture) so the unified timeline
 * is a single source of truth on subsequent loads.
 */
export async function persistVoiceTranscriptToHistory(input: {
  userId: number
  lectureId: number
  sessionId: string
}): Promise<void> {
  const data = await fetchTranscriptOnTokenServer(input.sessionId)
  const entries = transcriptToHistoryEntries(data.transcript)
  if (entries.length === 0) return

  const row = await loadOrCreateChatRow({
    userId: input.userId,
    lectureId: input.lectureId,
  })
  await appendChatHistoryEntries({ rowId: row.id, entries })
}

function transcriptToHistoryEntries(
  transcript: ReadonlyArray<TokenServerTranscriptEntry>,
): Array<AiChatHistoryEntry> {
  const out: Array<AiChatHistoryEntry> = []
  for (const entry of transcript) {
    if (!entry.content) continue
    const epoch = new Date(entry.timestamp).getTime()
    const timestamp = Number.isFinite(epoch) ? epoch : Date.now()
    out.push(entryToHistory(entry, timestamp))
  }
  return out
}

function entryToHistory(
  entry: TokenServerTranscriptEntry,
  timestamp: number,
): AiChatAudioStudentEntry | AiChatAudioAssistantEntry {
  if (entry.role === 'assistant') {
    return {
      type: 'audio_chat_ai_response',
      content: entry.content,
      timestamp,
    }
  }
  return {
    type: 'audio_chat_student_speaking',
    content: entry.content,
    timestamp,
  }
}
