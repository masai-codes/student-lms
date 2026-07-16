import { parseIstToMs } from '@/server/time/istClock'

const IST_TIME_ZONE = 'Asia/Kolkata'

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: IST_TIME_ZONE,
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: IST_TIME_ZONE,
}

function formatPart(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', options).format(date)
}

/** Date portion (`YYYY-MM-DD`) of an IST wall-clock DB datetime string. */
function istDatePart(value: string): string {
  return value.trim().replace('T', ' ').slice(0, 10)
}

export function formatLectureScheduleRange(
  schedule: string | null,
  concludes: string | null,
): string {
  if (schedule == null || schedule.trim() === '') {
    return ''
  }

  const startMs = parseIstToMs(schedule)
  if (startMs == null) {
    return ''
  }
  const start = new Date(startMs)

  if (concludes == null || concludes.trim() === '') {
    return formatPart(start, { ...DATE_FORMAT, ...TIME_FORMAT })
  }

  const endMs = parseIstToMs(concludes)
  if (endMs == null) {
    return formatPart(start, { ...DATE_FORMAT, ...TIME_FORMAT })
  }
  const end = new Date(endMs)

  const sameDay = istDatePart(schedule) === istDatePart(concludes)

  if (sameDay) {
    return `${formatPart(start, DATE_FORMAT)}, ${formatPart(start, TIME_FORMAT)} – ${formatPart(end, TIME_FORMAT)}`
  }

  return `${formatPart(start, { ...DATE_FORMAT, ...TIME_FORMAT })} – ${formatPart(end, { ...DATE_FORMAT, ...TIME_FORMAT })}`
}
