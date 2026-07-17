import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { sections } from '@/db/schema'

import { DEFAULT_SECTION_NAME } from '../utils/constants'

type SectionInsert = typeof sections.$inferInsert
type SectionSelect = typeof sections.$inferSelect

export type CreateSectionOverrides = Partial<Omit<SectionInsert, 'id'>>

export async function createSection(
  overrides: CreateSectionOverrides = {},
): Promise<SectionSelect> {
  const { batchId } = overrides
  if (batchId == null) {
    throw new Error('createSection requires batchId (pass via overrides)')
  }

  const values: SectionInsert = {
    name: DEFAULT_SECTION_NAME,
    description: 'Demo section for local seed data',
    active: 1,
    type: 'regular',
    assignmentPercentageWeightage: 0,
    attendancePercentageWeightage: 0,
    ...overrides,
    batchId,
  }

  const [result] = await db.insert(sections).values(values)
  const id = Number(result.insertId)

  const [row] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, id))
    .limit(1)
  if (!row) {
    throw new Error(`Failed to load section after insert (id=${id})`)
  }

  return row
}
