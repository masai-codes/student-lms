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

interface CategoryResolver {
  contentTypes: Set<string>
  // The log `path` for this route; a function when it varies by contentType.
  path: string | ((contentType: string) => string)
  fetch: (
    userId: number,
    id: number,
    contentType: string,
  ) => Promise<string | null>
}

// Each category maps to the field(s) it can serve. Assignments only carry
// `instructions`; `description` is accepted as an alias so the app can pass
// either without breaking. Resources (`lectures.type = reading`) expose a
// single `body` (notes ?? description); `notes` / `description` both map to it.
const CATEGORY_RESOLVERS: Record<string, CategoryResolver> = {
  lecture: {
    contentTypes: new Set(['notes', 'summary']),
    path: (contentType) =>
      contentType === 'summary' ? 'lecture.summary' : 'lecture.notes',
    fetch: (userId, id, contentType) =>
      contentType === 'summary'
        ? fetchLectureSummaryForUser(userId, id)
        : fetchLectureNotesForUser(userId, id),
  },
  resource: {
    contentTypes: new Set(['notes', 'description']),
    path: 'resource.body',
    fetch: (userId, id) => fetchResourceBodyForUser(userId, id),
  },
  assignment: {
    contentTypes: new Set(['instructions', 'description']),
    path: 'assignment.instructions',
    fetch: (userId, id) => fetchAssignmentInstructionsForUser(userId, id),
  },
}

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

  if (id == null) {
    console.warn('[notes-preview] invalid entityId', { userId, entityId })
    return { ...base, content: null }
  }

  const resolver = CATEGORY_RESOLVERS[category]
  if (!resolver || !resolver.contentTypes.has(contentType)) {
    console.warn('[notes-preview] unsupported category/contentType', {
      userId,
      category,
      contentType,
      id,
    })
    return { ...base, content: null }
  }

  console.info('[notes-preview] route', {
    path:
      typeof resolver.path === 'function'
        ? resolver.path(contentType)
        : resolver.path,
    userId,
    id,
    contentType,
  })
  const content = await resolver.fetch(userId, id, contentType)
  return { ...base, content }
}
