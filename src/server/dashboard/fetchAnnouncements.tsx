import { createServerFn } from '@tanstack/react-start'
import { and, gt, inArray, lt, sql } from 'drizzle-orm'
import { db } from '@/db'
import { announcements } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

const istNow = sql`
  DATE_ADD(NOW(), INTERVAL 330 MINUTE)
`

export const fetchAnnouncements = createServerFn({ method: 'GET' })
    .inputValidator((data: { userId: number }) => data)
    .handler(async ({ data }) => {
        try {

            /* 1️⃣ Get all batch IDs for the user (section enrollments) */
            const batchIds = await getBatchIdsForEnrolledUser(data.userId)

            if (!batchIds.length) return []

            /* 2️⃣ Get active assignments for those batchs */
            const activeAssignments = await db
                .select()
                .from(announcements)
                .where(
                    and(
                        inArray(announcements.batchId, batchIds),
                        lt(announcements.schedule, istNow),
                        gt(announcements.concludes, istNow)
                    )
                )
                console.log("😔", activeAssignments)

            return activeAssignments




        } catch (err) {
            console.error('🔥 Server/DB error', err)
            throw new Error('SERVER_ERROR_FETCHING_ANNOUNCEMENTS')
        }
    })
