import { and, eq, inArray, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { lectures, lecturesAi, sectionUser, users } from '@/db/schema'

export type AiTutorLectureContext = {
  lectureId: number
  title: string
  transcript: string
}

export class AiTutorLectureAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiTutorLectureAccessError'
  }
}

async function loadUserRoleAndName(
  userId: number,
): Promise<{ role: string | null; name: string }> {
  const rows = await db
    .select({ role: users.role, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (rows.length === 0) throw new AiTutorLectureAccessError('UNAUTHORIZED')
  const row = rows[0]
  return { role: row.role ?? null, name: row.name }
}

async function userHasSectionAccess(input: {
  userId: number
  lectureId: number
}): Promise<boolean> {
  const userSections = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(eq(sectionUser.userId, input.userId))

  if (userSections.length === 0) return false

  const sectionIds = userSections.map((s) => s.sectionId)
  const matchingLectures = await db
    .select({ id: lectures.id })
    .from(lectures)
    .where(
      and(
        eq(lectures.id, input.lectureId),
        inArray(lectures.sectionId, sectionIds),
        isNull(lectures.deletedAt),
      ),
    )
    .limit(1)

  return matchingLectures.length > 0
}

async function loadLecture(lectureId: number): Promise<{
  id: number
  title: string
} | null> {
  const rows = await db
    .select({ id: lectures.id, title: lectures.title })
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), isNull(lectures.deletedAt)))
    .limit(1)
  return rows[0] ?? null
}

async function loadTranscript(lectureId: number): Promise<string | null> {
  const rows = await db
    .select({
      summary: lecturesAi.summary,
      transcript: lecturesAi.transcript,
    })
    .from(lecturesAi)
    .where(eq(lecturesAi.lectureId, lectureId))
    .limit(1)
  if (rows.length === 0) return null
  const row = rows[0]
  return row.summary ?? row.transcript ?? null
}

/**
 * Resolves the lecture context the AI tutor needs and enforces access:
 *  - admin role → unrestricted
 *  - other roles → must belong to a section that owns this lecture
 */
export async function resolveAiTutorLectureContext(input: {
  userId: number
  lectureId: number
}): Promise<{ context: AiTutorLectureContext; participantName: string }> {
  const { role, name } = await loadUserRoleAndName(input.userId)

  if (role !== 'admin') {
    const allowed = await userHasSectionAccess({
      userId: input.userId,
      lectureId: input.lectureId,
    })
    if (!allowed) {
      throw new AiTutorLectureAccessError('AI_TUTOR_LECTURE_FORBIDDEN')
    }
  }

  const lecture = await loadLecture(input.lectureId)
  if (!lecture) {
    throw new AiTutorLectureAccessError('AI_TUTOR_LECTURE_NOT_FOUND')
  }

  const transcript = await loadTranscript(lecture.id)
  if (!transcript) {
    throw new AiTutorLectureAccessError('AI_TUTOR_TRANSCRIPT_UNAVAILABLE')
  }

  return {
    context: {
      lectureId: lecture.id,
      title: lecture.title,
      transcript,
    },
    participantName: name || `user-${input.userId}`,
  }
}
