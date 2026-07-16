import { createServerFn } from '@tanstack/react-start'
import { and, eq, ne, sql } from 'drizzle-orm'
// import type { InferSelectModel } from "drizzle-orm";
import { db } from '@/db'
import { lectures } from '@/db/schema'

export const fetchAllLecturesCount = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: number; batchId: number | null }) => data)
  .handler(async ({ data }) => {
    const conditions = [
      ne(lectures.category, 'reading'),
      ...(data.batchId !== null ? [eq(lectures.batchId, data.batchId)] : []),
    ]

    const result = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(lectures)
      .where(and(...conditions))

    return result[0].count
  })
