import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { assignments } from '@/db/schema'

export const fetchAssignmentById = createServerFn({ method: 'GET' })
  .inputValidator((data: { assignmentId: number }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, data.assignmentId))

    if (result.length === 0) {
      throw new Error('ASSIGNMENT_NOT_FOUND')
    }

    return result
  })
