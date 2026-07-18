import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { lecturesAi } from '@/db/schema'

type LecturesAiInsert = typeof lecturesAi.$inferInsert
type LecturesAiSelect = typeof lecturesAi.$inferSelect

export type CreateLecturesAiOverrides = Partial<Omit<LecturesAiInsert, 'id'>>

export async function createLecturesAi(
  overrides: CreateLecturesAiOverrides = {},
): Promise<LecturesAiSelect> {
  const { lectureId } = overrides
  if (lectureId == null) {
    throw new Error('createLecturesAi requires lectureId')
  }

  const values: LecturesAiInsert = {
    isSummaryPublished: 1,
    isConceptsPublished: 0,
    ...overrides,
    lectureId,
  }

  const [result] = await db.insert(lecturesAi).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(lecturesAi).where(eq(lecturesAi.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load lectures_ai after insert (id=${id})`)
  }

  return row
}
