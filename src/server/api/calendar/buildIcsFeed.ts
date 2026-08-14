import type { CalendarEventDto } from './calendarTypes'
import { parseIstToMs } from '@/server/time/istClock'

/**
 * Serializes calendar events into an iCalendar (RFC 5545) feed. Times are
 * emitted in true UTC (converted from the DTOs' explicit-IST stamps), so every
 * calendar app renders them correctly in the subscriber's timezone — the feed
 * mirrors exactly what the /my-calendar page shows.
 */
export function buildIcsFeed(input: {
  events: Array<CalendarEventDto>
  /** Absolute app origin for event deep links, e.g. `https://lms.example.com`. */
  origin: string
  now?: Date
}): string {
  const stamp = formatUtc((input.now ?? new Date()).getTime())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Masai//Student LMS Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Masai Schedule',
  ]

  for (const event of input.events) {
    const startMs = parseIstToMs(event.schedule)
    const endMs = parseIstToMs(event.effectiveEnd)
    if (startMs == null || endMs == null) continue

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.type}-${event.id}@masai-student-lms`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatUtc(startMs)}`,
      `DTEND:${formatUtc(endMs)}`,
      `SUMMARY:${escapeIcsText(icsTitle(event))}`,
      `DESCRIPTION:${escapeIcsText(icsDescription(event))}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
    )
    if (event.detailPath) {
      lines.push(`URL:${input.origin}${event.detailPath}`)
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.map(foldIcsLine).join('\r\n')
}

function icsTitle(event: CalendarEventDto): string {
  const prefix =
    event.type === 'lecture' ? '' : event.type === 'quiz' ? 'Quiz: ' : 'Assignment: '
  return `${prefix}${event.title}`
}

function icsDescription(event: CalendarEventDto): string {
  const parts = [
    event.batchName,
    event.sectionName,
    event.hostName ? `Instructor: ${event.hostName}` : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

/** Epoch ms → `YYYYMMDDTHHMMSSZ`. */
function formatUtc(ms: number): string {
  return `${new Date(ms).toISOString().slice(0, 19).replace(/[-:]/g, '')}Z`
}

/** RFC 5545 text escaping: backslash, semicolon, comma, newline. */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** RFC 5545 line folding: lines over 75 octets continue with a leading space. */
function foldIcsLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: Array<string> = []
  let rest = line
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75))
    rest = ` ${rest.slice(75)}`
  }
  chunks.push(rest)
  return chunks.join('\r\n')
}
