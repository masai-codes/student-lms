import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { lectures } from '@/db/schema'

export const fetchResourceById = createServerFn({ method: 'GET' })
  .inputValidator((data: { resourceId: number }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .select()
      .from(lectures)
      .where(eq(lectures.id, data.resourceId))

    if (result.length === 0) {
      throw new Error('LECTURE_NOT_FOUND')
    }

    return result
  })
