import { createServerFn } from '@tanstack/react-start'
import { and, eq, sql } from 'drizzle-orm'
// import type { InferSelectModel } from "drizzle-orm";
import { db } from '@/db'
import { assignments } from '@/db/schema'

export const fetchAllAssignmentsCount = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: number; batchId: number | null }) => data)
  .handler(async ({ data }) => {
    const conditions = [
      ...(data.batchId !== null ? [eq(assignments.batchId, data.batchId)] : []),
    ]

    const result = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(assignments)
      .where(and(...conditions))

    console.log('Row count ❤️', result[0].count)

    return result[0].count
  })
