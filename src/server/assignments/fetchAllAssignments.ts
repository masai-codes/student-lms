import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '@/db'
import { assignments } from '@/db/schema'
import { PAGINATION_PAGE_SIZE } from '@/globalSettings'

export type AssignmentsType = InferSelectModel<typeof assignments>

export const fetchAllAssignments = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { userId: number; batchId?: number | null; page?: number }) => data,
  )
  .handler(async ({ data }) => {
    console.log('📥 Request reached server', data.page)

    try {
      const page = data.page ?? 1
      const offset = (page - 1) * PAGINATION_PAGE_SIZE

      const conditions = [
        data.batchId != null
          ? eq(assignments.batchId, data.batchId)
          : undefined,
      ].filter(Boolean)

      const rows = await db
        .select()
        .from(assignments)
        .where(and(...conditions))
        .orderBy(desc(assignments.createdAt))
        .limit(PAGINATION_PAGE_SIZE)
        .offset(offset)

      console.log('🙈', rows)
      return rows
    } catch (err) {
      console.error('🔥 Server/DB error', err)
      throw new Error('SERVER_ERROR_FETCHING_LECTURES')
    }
  })
