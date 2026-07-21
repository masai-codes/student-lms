import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { sectionUser } from '@/db/schema'

type EnrollmentInsert = typeof sectionUser.$inferInsert
type EnrollmentSelect = typeof sectionUser.$inferSelect

export type CreateEnrollmentOverrides = Partial<Omit<EnrollmentInsert, 'id'>>

export async function createEnrollment(
  overrides: CreateEnrollmentOverrides = {},
): Promise<EnrollmentSelect> {
  const { sectionId, userId } = overrides
  if (sectionId == null || userId == null) {
    throw new Error('createEnrollment requires sectionId and userId')
  }

  const values: EnrollmentInsert = {
    role: 'student',
    ...overrides,
    sectionId,
    userId,
  }

  const [result] = await db.insert(sectionUser).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(sectionUser)
    .where(eq(sectionUser.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load enrollment after insert (id=${id})`)
  }

  return row
}
