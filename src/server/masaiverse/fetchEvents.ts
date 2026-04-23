import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq, inArray, isNull, like, or } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "@/db"
import { clubMembers, events, users } from "@/db/schema"
import { getCurrentSessionUserId } from "@/server/auth/getCurrentSessionUserId"
import { eventDbTimestampToMs } from "@/lib/eventTimestamps"

export type EventType = InferSelectModel<typeof events>

export const fetchAllEvents = createServerFn({ method: "GET" })
  .inputValidator((data: { searchQuery?: string } = {}) => data)
  .handler(fetchAllEventsHandler)

export async function fetchAllEventsHandler({ data }: { data: { searchQuery?: string } }) {
    try {
      const userId = await getCurrentSessionUserId()
      const currentUser = userId
        ? await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
        : []
      const isAdminUser =
        String(currentUser[0]?.role ?? "")
          .trim()
          .toLowerCase() === "admin"
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
        isAdminUser
          ? await db
              .select()
              .from(events)
              .where(searchCondition)
              .orderBy(asc(events.startTime), asc(events.createdAt))
          : joinedClubIdsArray.length > 0
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
        const aEnd = eventDbTimestampToMs(a.endTime) ?? Number.POSITIVE_INFINITY
        const bEnd = eventDbTimestampToMs(b.endTime) ?? Number.POSITIVE_INFINITY
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

        const aStart = eventDbTimestampToMs(a.startTime) ?? Number.POSITIVE_INFINITY
        const bStart = eventDbTimestampToMs(b.startTime) ?? Number.POSITIVE_INFINITY

        if (aStart !== bStart) {
          return aStart - bStart
        }

        const aCreated = eventDbTimestampToMs(a.createdAt) ?? Number.POSITIVE_INFINITY
        const bCreated = eventDbTimestampToMs(b.createdAt) ?? Number.POSITIVE_INFINITY
        return aCreated - bCreated
      })
    } catch (err) {
      console.error("🔥 Server/DB error", err)
      throw new Error("SERVER_ERROR_FETCHING_EVENTS")
    }
  }
