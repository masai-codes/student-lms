import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq, inArray, isNull, like, or } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "@/db"
import { clubMembers, events } from "@/db/schema"
import { getCurrentSessionUserId } from "@/server/auth/getCurrentSessionUserId"

export type EventType = InferSelectModel<typeof events>

export const fetchAllEvents = createServerFn({ method: "GET" })
  .inputValidator((data: { searchQuery?: string } = {}) => data)
  .handler(async ({ data }) => {
    try {
      const userId = await getCurrentSessionUserId()
      const memberships = userId
        ? await db
            .select({ clubId: clubMembers.clubId })
            .from(clubMembers)
            .where(eq(clubMembers.userId, userId))
        : []
      const joinedClubIds = new Set(memberships.map((membership) => membership.clubId))

      const joinedClubIdsArray = Array.from(joinedClubIds)
      const sanitizedSearchQuery = data.searchQuery?.trim()
      const searchCondition = sanitizedSearchQuery
        ? like(events.title, `%${sanitizedSearchQuery}%`)
        : undefined

      const fetchedEvents =
        joinedClubIdsArray.length > 0
          ? await db
              .select()
              .from(events)
              .where(
                and(
                  or(isNull(events.clubId), inArray(events.clubId, joinedClubIdsArray)),
                  searchCondition,
                ),
              )
              .orderBy(asc(events.startTime), asc(events.createdAt))
          : await db
              .select()
              .from(events)
              .where(and(isNull(events.clubId), searchCondition))
              .orderBy(asc(events.startTime), asc(events.createdAt))

      const now = Date.now()
      return [...fetchedEvents].sort((a, b) => {
        const aEnd = a.endTime ? new Date(a.endTime).getTime() : Number.POSITIVE_INFINITY
        const bEnd = b.endTime ? new Date(b.endTime).getTime() : Number.POSITIVE_INFINITY
        const aEnded = Number.isFinite(aEnd) && aEnd < now
        const bEnded = Number.isFinite(bEnd) && bEnd < now

        const getRank = (eventEnded: boolean, eventClubId: string | null) => {
          if (eventEnded) return 2
          if (eventClubId && joinedClubIds.has(eventClubId)) return 0
          return 1
        }

        // Order by: active joined-club events -> other active events -> ended events.
        const aRank = getRank(aEnded, a.clubId)
        const bRank = getRank(bEnded, b.clubId)
        if (aRank !== bRank) {
          return aRank - bRank
        }

        const aStart = a.startTime ? new Date(a.startTime).getTime() : Number.POSITIVE_INFINITY
        const bStart = b.startTime ? new Date(b.startTime).getTime() : Number.POSITIVE_INFINITY

        if (aStart !== bStart) {
          return aStart - bStart
        }

        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : Number.POSITIVE_INFINITY
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : Number.POSITIVE_INFINITY
        return aCreated - bCreated
      })
    } catch (err) {
      console.error("🔥 Server/DB error", err)
      throw new Error("SERVER_ERROR_FETCHING_EVENTS")
    }
  })
