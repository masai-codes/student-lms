import { createServerFn } from "@tanstack/react-start"
import { desc, sql } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "@/db"
import { clubMembers, clubs } from "@/db/schema"

type ClubRow = InferSelectModel<typeof clubs>
type ClubMeta = {
  mini_description?: string
}

export type ClubType = Omit<ClubRow, "meta"> & {
  meta: ClubMeta | null
  /** Rows in `club_members` for this club (live join count). */
  joinedMemberCount: number
}

export const fetchAllClubs = createServerFn({ method: "GET" }).handler(fetchAllClubsHandler)

export async function fetchAllClubsHandler() {
  try {
    const clubsData = await db.select().from(clubs).orderBy(desc(clubs.createdAt))

    const memberCountRows = await db
      .select({
        clubId: clubMembers.clubId,
        memberCount: sql<number>`cast(count(*) as unsigned)`,
      })
      .from(clubMembers)
      .groupBy(clubMembers.clubId)

    const countByClubId = new Map(
      memberCountRows.map((row) => [row.clubId, Number(row.memberCount)]),
    )

    return clubsData.map((club) => ({
      ...club,
      meta: (club.meta as ClubMeta | null) ?? null,
      joinedMemberCount: countByClubId.get(club.id) ?? 0,
    }))
  } catch (err) {
    console.error("🔥 Server/DB error", err)
    throw new Error("SERVER_ERROR_FETCHING_CLUBS")
  }
}
