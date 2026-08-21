import type {
  CalendarEntityRow,
  CalendarEventDto,
  CalendarEventType,
  CalendarJoinLive,
} from './calendarTypes'
import {
  ASSIGNMENT_FALLBACK_MS,
  LECTURE_FALLBACK_MS,
  QUIZ_FALLBACK_MS,
} from './calendarWindow'
import { buildLearnListingCardCtas } from '@/server/learn/utils/buildLearnListingCardCtas'
import { isIvsZoomRedirection } from '@/server/learn/utils/isIvsZoomRedirection'
import { resolveEnableZoomWebView } from '@/server/learn/utils/resolveEnableZoomWebView'
import { parseIstToMs } from '@/server/time/istClock'

const IST_OFFSET_MS = (5 * 60 + 30) * 60_000

const END_FALLBACK_MS: Record<CalendarEventType, number> = {
  lecture: LECTURE_FALLBACK_MS,
  assignment: ASSIGNMENT_FALLBACK_MS,
  quiz: QUIZ_FALLBACK_MS,
}

/** Epoch ms → explicit-IST ISO (`YYYY-MM-DDTHH:MM:SS+05:30`). */
export function formatMsAsIstIso(ms: number): string {
  return `${new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 19)}+05:30`
}

/**
 * Maps a fetched row to the calendar event DTO: IST-stamps the datetimes,
 * derives `effectiveEnd` (`concludes`, or schedule + per-type fallback so
 * every event has a real span), the in-app `detailPath`, and — for lectures —
 * the join-live CTA state via the shared learn CTA builder. Returns `null`
 * for rows without a schedule (they can't be placed on a calendar).
 */
export function buildCalendarEvent(input: {
  row: CalendarEntityRow
  type: CalendarEventType
  nowMs: number
}): CalendarEventDto | null {
  const { row, type, nowMs } = input

  // The DB driver may hand datetimes back either as naive IST wall-clock
  // strings or already stamped with +05:30 (columnTypes.ts). Parse to an
  // instant and re-format — string concatenation would double-stamp the
  // pre-stamped form.
  const scheduleMs = parseIstToMs(row.schedule)
  if (scheduleMs == null) return null

  const concludesMs = parseIstToMs(row.concludes)
  const effectiveEndMs =
    concludesMs != null && concludesMs > scheduleMs
      ? concludesMs
      : scheduleMs + END_FALLBACK_MS[type]

  return {
    id: row.id,
    type,
    title: row.title,
    schedule: formatMsAsIstIso(scheduleMs),
    // Only a trusted end survives as `concludes`; degenerate values (missing
    // or not after the start) fall back through `effectiveEnd`.
    concludes:
      concludesMs != null && concludesMs > scheduleMs
        ? formatMsAsIstIso(concludesMs)
        : null,
    effectiveEnd: formatMsAsIstIso(effectiveEndMs),
    optional: row.optional === 1,
    sectionId: row.sectionId,
    sectionName: row.sectionName,
    batchName: row.batchName,
    hostName: type === 'lecture' ? row.hostName : null,
    detailPath: resolveDetailPath(type, row.id),
    joinLive: type === 'lecture' ? resolveJoinLive(row, nowMs) : null,
  }
}

function resolveDetailPath(type: CalendarEventType, id: number): string | null {
  if (type === 'lecture') return `/lectures/${id}`
  if (type === 'assignment') return `/assignments/${id}`
  // No quiz detail route exists in the new LMS yet.
  return null
}

function resolveJoinLive(
  row: CalendarEntityRow,
  nowMs: number,
): CalendarJoinLive | null {
  const ctas = buildLearnListingCardCtas({
    learningType: 'lecture',
    lectureId: row.id,
    itemType: row.type,
    schedule: row.schedule,
    concludes: row.concludes,
    isMandatory: row.optional !== 1,
    zoomLink: row.zoomLink,
    isNewZoomRedirection: row.isNewZoomRedirection === 1,
    isIvsRedirection: isIvsZoomRedirection(row.zoomDetails),
    enableZoomWebView: resolveEnableZoomWebView(row.sectionSettings),
    nowMs,
    attendance: null,
    assignmentProgressStatus: null,
    assignmentScore: null,
  })

  if (ctas.joinLive === 'hidden') return null

  return {
    state: ctas.joinLive,
    joinZoomLink: ctas.joinZoomLink,
    isNewZoomRedirection: ctas.isNewZoomRedirection,
    enableZoomWebView: ctas.enableZoomWebView,
  }
}
