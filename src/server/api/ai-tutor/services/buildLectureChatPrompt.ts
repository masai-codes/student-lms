import type { AiChatHistoryEntry } from '@/server/api/ai-tutor/types/chatHistory'
import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import type { LectureChatMaterials } from '@/server/api/ai-tutor/types/lectureChatMaterials'
import {
  AI_TUTOR_LECTURE_CHAT_RAG_GUIDANCE,
  AI_TUTOR_LECTURE_CHAT_RESPONSE_GUIDANCE,
  AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT_BASE,
  AI_TUTOR_LECTURE_RAG_TOOL_NAME,
  buildEnforcedChatLanguageInstruction,
} from '@/server/api/ai-tutor/constants'
import { formatLectureSharedResourcesForPrompt } from '@/server/api/ai-tutor/services/formatLectureSharedResources'

export type LectureChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function formatSummarySection(summary: string | null): string {
  return summary ?? 'No lecture summary is available for this lecture.'
}

function formatNotesSection(materials: LectureChatMaterials): string {
  if (materials.notesInline) {
    return materials.notesInline
  }

  if (materials.notesOutline) {
    return `Instructor notes are indexed for retrieval. Table of contents:\n${materials.notesOutline}`
  }

  if (materials.notesRagged) {
    return 'Instructor notes are indexed for retrieval. No table of contents is available.'
  }

  return 'No instructor notes are available for this lecture.'
}

function formatRagGuidance(materials: LectureChatMaterials): string {
  if (!materials.ragRetrievalAvailable) return ''

  return `

${AI_TUTOR_LECTURE_CHAT_RAG_GUIDANCE}

The \`${AI_TUTOR_LECTURE_RAG_TOOL_NAME}\` tool is available for this lecture.`
}

export function buildLectureChatSystemPrompt(
  materials: LectureChatMaterials,
  language: AiTutorChatLanguage,
): string {
  return `${AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT_BASE}

${buildEnforcedChatLanguageInstruction(language)}

${AI_TUTOR_LECTURE_CHAT_RESPONSE_GUIDANCE}${formatRagGuidance(materials)}

## Lecture
Title: ${materials.title}

## Resources shared
${formatLectureSharedResourcesForPrompt(materials.resourcesShared)}

## Lecture content (summary)
${formatSummarySection(materials.summary)}

## Instructor notes
${formatNotesSection(materials)}`
}

export function buildLectureChatMessages(input: {
  chatHistory: Array<AiChatHistoryEntry>
  question: string
}): Array<LectureChatMessage> {
  const messages: Array<LectureChatMessage> = []

  for (const entry of input.chatHistory) {
    if (entry.userMessage) {
      messages.push({ role: 'user', content: entry.userMessage })
    }
    if (entry.aiMessage) {
      messages.push({ role: 'assistant', content: entry.aiMessage })
    }
  }

  messages.push({ role: 'user', content: input.question })

  return messages
}
