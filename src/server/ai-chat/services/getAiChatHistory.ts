import type { AiChatMessage } from '@/server/ai-chat/types'

import { projectHistoryToMessages } from '@/server/ai-chat/services/aiChatHistoryProjection'
import { findChatRow } from '@/server/ai-chat/services/aiChatPracticeQuestions.repo'

/**
 * Returns the unified chat timeline for one (user, lecture) by projecting the
 * persisted JSON history into a flat list of messages. Voice and text both
 * live in the same JSON blob, so no token server fetch is needed here — voice
 * transcripts are persisted at session-end via `endAiTutorSession`.
 */
export async function getAiChatHistory(input: {
  userId: number
  lectureId: number
}): Promise<Array<AiChatMessage>> {
  const row = await findChatRow(input)
  if (!row) return []
  return projectHistoryToMessages(row.chatHistory, row.id)
}
