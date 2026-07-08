import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { whatsnew } from '@/db/schema'

type WhatsnewInsert = typeof whatsnew.$inferInsert
type WhatsnewSelect = typeof whatsnew.$inferSelect

export type CreateWhatsnewOverrides = Partial<Omit<WhatsnewInsert, 'id'>>

export async function createWhatsnew(
  overrides: CreateWhatsnewOverrides = {},
): Promise<WhatsnewSelect> {
  const values: WhatsnewInsert = {
    subject: 'Product update',
    body: 'What is new in the LMS.',
    image: 'https://example.com/whatsnew.png',
    ...overrides,
  }

  const [result] = await db.insert(whatsnew).values(values)
  const id = Number(result.insertId)

  const [row] = await db.select().from(whatsnew).where(eq(whatsnew.id, id)).limit(1)
  if (!row) {
    throw new Error(`Failed to load whatsnew row after insert (id=${id})`)
  }

  return row
}
