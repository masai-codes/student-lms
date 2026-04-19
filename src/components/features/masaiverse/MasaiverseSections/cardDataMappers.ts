import type { ClubCardProps } from "@/components/club-card"
import type { EventCardProps } from "@/components/event-card"
import type { ClubType } from "@/server/masaiverse/fetchClubs"
import type { EventType } from "@/server/masaiverse/fetchEvents"
import { parseMasaiverseEventDbTimestamp } from "@/lib/eventTimestamps"

type ClubMeta = {
  mini_description?: string
  detail_description?: string
  detail_points?: Array<string>
  cta_theme?: "yellow" | "red"
  cta_text?: string
}

type EventMeta = {
  mini_description?: string
  detail_description?: string
  timeline?: EventCardProps["eventTimeline"]
  image?: string
  is_active?: boolean
  cta_text?: string
}

const EVENT_DISPLAY_TZ = "Asia/Kolkata"

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: EVENT_DISPLAY_TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: EVENT_DISPLAY_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})

const getDateTimeLabel = (value?: string | null) => {
  if (!value) {
    return { date: "TBD", time: "TBD" }
  }

  const parsed = parseMasaiverseEventDbTimestamp(value)
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { date: "TBD", time: "TBD" }
  }

  return {
    date: DATE_FORMATTER.format(parsed),
    time: TIME_FORMATTER.format(parsed),
  }
}

function normalizeDetailPoints(points: unknown): Array<string> {
  if (!Array.isArray(points)) return []
  return points
    .map((p) => String(p).trim())
    .filter(Boolean)
}

export const mapClubToCardProps = (club: ClubType): ClubCardProps => {
  const meta = (club.meta ?? {}) as ClubMeta

  return {
    domain: club.domain || "General",
    name: club.name,
    imageUrl: club.image || "/Masaiverse.svg",
    miniDescription: meta.mini_description || "",
    ctaText: meta.cta_text || "Join",
    totalMembers: club.joinedMemberCount,
    detailPoints: normalizeDetailPoints(meta.detail_points),
    detailDescription:
      meta.detail_description || meta.mini_description || "No details available yet.",
    ctaTheme: meta.cta_theme || "yellow",
  }
}

export const mapEventToCardProps = (event: EventType): EventCardProps => {
  const meta = (event.meta ?? {}) as EventMeta
  const eventImageLink =
    (event as EventType & { imageLink?: string | null; image_link?: string | null }).imageLink ||
    (event as EventType & { imageLink?: string | null; image_link?: string | null }).image_link
  const { date, time } = getDateTimeLabel(event.startTime)
  const isOnline = event.mode !== "offline"
  const locationLink = event.locationMapLink || event.eventLink || undefined
  const modeLabel = event.mode ? event.mode[0].toUpperCase() + event.mode.slice(1) : "TBD"

  return {
    title: event.title,
    miniDescription: meta.mini_description || event.description || "",
    ctaText: "Enroll",
    isActive: meta.is_active ?? Boolean(event.startTime),
    category: event.category || "event",
    image: eventImageLink || meta.image || "/Masaiverse.svg",
    date,
    time,
    isOnline,
    eventLocationLink: locationLink,
    eventLocationText: event.locationTitle || undefined,
    eventMode: event.platform || event.locationTitle || modeLabel,
    eventDetailDescription: meta.detail_description || event.description || "No details available yet.",
    eventTimeline: meta.timeline?.length ? meta.timeline : [],
  }
}
