import { eq } from 'drizzle-orm'
import type { LectureChatMaterials } from '@/server/api/ai-tutor/types/lectureChatMaterials'
import { db } from '@/db'
import { lectureZoomChat, lectures, lecturesAi } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { isRagPlatformConfigured } from '@/server/api/ai-tutor/clients/ragPlatform'
import {
  readNotesRaggedFromLectureData,
  readNotesTocFromLectureData,
} from '@/server/api/ai-tutor/services/lectureNotesTocData'
import { parseLectureZoomChatResources } from '@/server/api/ai-tutor/services/parseLectureZoomChatResources'

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildMaterials(input: {
  lectureId: number
  title: string
  summary: string | null
  resourcesShared: LectureChatMaterials['resourcesShared']
  notes: string | null
  notesRagged: boolean
  notesOutline: string | null
}): LectureChatMaterials {
  const notesCharacterCount = input.notes?.length ?? 0

  if (input.notesRagged) {
    return {
      lectureId: input.lectureId,
      title: input.title,
      summary: input.summary,
      resourcesShared: input.resourcesShared,
      notesRagged: true,
      notesInline: null,
      notesOutline: input.notesOutline,
      notesCharacterCount,
      ragRetrievalAvailable: isRagPlatformConfigured(),
    }
  }

  return {
    lectureId: input.lectureId,
    title: input.title,
    summary: input.summary,
    resourcesShared: input.resourcesShared,
    notesRagged: false,
    notesInline: input.notes,
    notesOutline: null,
    notesCharacterCount,
    ragRetrievalAvailable: false,
  }
}

export async function getLectureChatMaterials(
  lectureId: number,
): Promise<LectureChatMaterials> {
  const [lectureRows, aiRows, zoomChatRows] = await Promise.all([
    db
      .select({
        title: lectures.title,
        notes: lectures.notes,
        data: lectures.data,
      })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1),
    db
      .select({ summary: lecturesAi.summary })
      .from(lecturesAi)
      .where(eq(lecturesAi.lectureId, lectureId))
      .limit(1),
    db
      .select({ finalChat: lectureZoomChat.finalChat })
      .from(lectureZoomChat)
      .where(eq(lectureZoomChat.lectureId, lectureId))
      .limit(1),
  ])

  if (!lectureRows[0]) {
    throw new ApiError(404, 'AI_TUTOR_LECTURE_NOT_FOUND')
  }

  const notes = trimOrNull(lectureRows[0].notes)
  const summary = trimOrNull(aiRows[0]?.summary)
  const title = lectureRows[0].title.trim()
  const resourcesShared = parseLectureZoomChatResources(
    zoomChatRows[0]?.finalChat ?? null,
  )
  const notesRagged =
    readNotesRaggedFromLectureData(lectureRows[0].data) === true

  return buildMaterials({
    lectureId,
    title,
    summary,
    resourcesShared,
    notes,
    notesRagged,
    notesOutline: readNotesTocFromLectureData(lectureRows[0].data),
  })
}
