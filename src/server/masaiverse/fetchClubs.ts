import { createServerFn } from "@tanstack/react-start"
import { desc } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "@/db"
import { clubs } from "@/db/schema"

type ClubRow = InferSelectModel<typeof clubs>
type ClubMeta = {
  mini_description?: string
}

export type ClubType = Omit<ClubRow, "meta"> & {
  meta: ClubMeta | null
}

export const fetchAllClubs = createServerFn({ method: "GET" }).handler(fetchAllClubsHandler)

export async function fetchAllClubsHandler() {
  try {
    const clubsData = await db.select().from(clubs).orderBy(desc(clubs.createdAt))

    return clubsData.map((club) => ({
      ...club,
      meta: (club.meta as ClubMeta | null) ?? null,
    }))
  } catch (err) {
    console.error("🔥 Server/DB error", err)
    throw new Error("SERVER_ERROR_FETCHING_CLUBS")
  }
}
