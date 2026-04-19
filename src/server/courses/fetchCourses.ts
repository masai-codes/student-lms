import { createServerFn } from '@tanstack/react-start';
import { desc, inArray } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '@/db';
import { batches } from '@/db/schema';
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser';

export type CourseType = InferSelectModel<typeof batches>

// TODO: Fetch only 10 enteries at a time. Make another request on scrollend

export const fetchAllCourses = createServerFn({ method: "GET" })
  .inputValidator((data: { userId: number }) => data)
  .handler(async ({ data }) => {

    try {

      const batchIds = await getBatchIdsForEnrolledUser(data.userId)

      if (batchIds.length === 0) return [];

      const batchesData = await db
        .select()
        .from(batches)
        .where(inArray(batches.id, batchIds))
        .orderBy(desc(batches.createdAt))

      return batchesData

  } catch (err) {
    console.error("🔥 Server/DB error", err)

    throw new Error("SERVER_ERROR_FETCHING_LECTURES")
  }
  })
