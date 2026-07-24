import { getAssignmentLearningDetailForUser } from '@/server/learn/services/getAssignmentLearningDetail.service'
import { getLectureLearningDetailForUser } from '@/server/learn/services/getLectureLearningDetail.service'

/**
 * Content-by-ID payload backing the `/notes-preview-v2` WebView. `content` is
 * the raw markdown for the requested field, or `null` when the
 * category/contentType combination is unsupported or the entity id is missing
 * or malformed — the client renders an empty state instead of crashing.
 */
export interface NotesPreviewPayload {
  category: string
  contentType: string
  entityId: number | null
  content: string | null
}

export interface NotesPreviewParams {
  userId: number
  category: string
  contentType: string
  entityId: string
}

// Assignments only carry `instructions`; `description` is accepted as an alias
// so the app can pass either without breaking.
const LECTURE_CONTENT_TYPES = new Set(['notes', 'summary'])
const ASSIGNMENT_CONTENT_TYPES = new Set(['instructions', 'description'])

function parseEntityId(raw: string): number | null {
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export async function getNotesPreviewContent({
  userId,
  category,
  contentType,
  entityId,
}: NotesPreviewParams): Promise<NotesPreviewPayload> {
  const id = parseEntityId(entityId)
  const base = { category, contentType, entityId: id }

  if (id == null) return { ...base, content: null }

  if (category === 'lecture' && LECTURE_CONTENT_TYPES.has(contentType)) {
    const detail = await getLectureLearningDetailForUser(userId, id)
    const content =
      contentType === 'summary' ? detail.tabs.aiSummary : detail.notes
    return { ...base, content: content ?? null }
  }

  if (category === 'assignment' && ASSIGNMENT_CONTENT_TYPES.has(contentType)) {
    const detail = await getAssignmentLearningDetailForUser(userId, id)
    return { ...base, content: detail.instructions ?? null }
  }

  return { ...base, content: null }
}
