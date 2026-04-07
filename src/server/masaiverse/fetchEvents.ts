import { createServerFn } from "@tanstack/react-start"
import { desc } from "drizzle-orm"
import type { InferSelectModel } from "drizzle-orm"
import { db } from "@/db"
import { events } from "@/db/schema"

export type EventType = InferSelectModel<typeof events>

export const fetchAllEvents = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await db.select().from(events).orderBy(desc(events.startTime), desc(events.createdAt))
  } catch (err) {
    console.error("🔥 Server/DB error", err)
    throw new Error("SERVER_ERROR_FETCHING_EVENTS")
  }
})
