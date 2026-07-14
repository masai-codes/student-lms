import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, ne } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '@/db'
import { lectures } from '@/db/schema'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'

export type LectureType = InferSelectModel<typeof lectures>

// NOTE: Below function can be used to fetch all lectures with or without batchId for an user.

export const fetchAllLectures = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { userId: number; batchId?: number | null; page?: number }) => data,
  )
  .handler(async ({ data }) => {
    try {
      // await new Promise((r) => setTimeout(r, 3000))

      const page = data.page ?? 1
      const offset = (page - 1) * PAGINATION_PAGE_SIZE

      const conditions = [
        ne(lectures.category, 'reading'),
        data.batchId != null ? eq(lectures.batchId, data.batchId) : undefined,
      ].filter(Boolean)

      const rows = await db
        .select()
        .from(lectures)
        .where(and(...conditions))
        .orderBy(desc(lectures.createdAt))
        .limit(PAGINATION_PAGE_SIZE)
        .offset(offset)

      return rows
    } catch (err) {
      console.error('🔥 Server/DB error', err)
      throw new Error('SERVER_ERROR_FETCHING_LECTURES')
    }
  })
