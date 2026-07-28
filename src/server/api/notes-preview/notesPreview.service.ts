import {
  fetchAssignmentInstructionsForUser,
  fetchLectureNotesForUser,
  fetchLectureSummaryForUser,
  fetchResourceBodyForUser,
} from '@/server/api/notes-preview/notesPreviewQueries'

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
// so the app can pass either without breaking. Resources (`lectures.type =
// reading`) expose a single `body` (notes ?? description); `notes` /
// `description` both map to that field.
const LECTURE_CONTENT_TYPES = new Set(['notes', 'summary'])
const ASSIGNMENT_CONTENT_TYPES = new Set(['instructions', 'description'])
const RESOURCE_CONTENT_TYPES = new Set(['notes', 'description'])

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
    const content =
      contentType === 'summary'
        ? await fetchLectureSummaryForUser(userId, id)
        : await fetchLectureNotesForUser(userId, id)
    return { ...base, content }
  }

  if (category === 'resource' && RESOURCE_CONTENT_TYPES.has(contentType)) {
    const content = await fetchResourceBodyForUser(userId, id)
    return { ...base, content }
  }

  if (category === 'assignment' && ASSIGNMENT_CONTENT_TYPES.has(contentType)) {
    const content = await fetchAssignmentInstructionsForUser(userId, id)
    return { ...base, content }
  }

  return { ...base, content: null }
}
