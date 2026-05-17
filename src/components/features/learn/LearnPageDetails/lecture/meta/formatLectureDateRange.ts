const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}

function formatPart(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', options).format(date)
}

/** Human-readable schedule window, e.g. "10 May 2026, 3:30 pm – 5:30 pm". */
export function formatLectureDateRange(
  scheduleStart: string,
  scheduleEnd: string,
): string {
  const start = new Date(scheduleStart)
  const end = new Date(scheduleEnd)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return ''
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  if (sameDay) {
    return `${formatPart(start, DATE_FORMAT)}, ${formatPart(start, TIME_FORMAT)} – ${formatPart(end, TIME_FORMAT)}`
  }

  return `${formatPart(start, { ...DATE_FORMAT, ...TIME_FORMAT })} – ${formatPart(end, { ...DATE_FORMAT, ...TIME_FORMAT })}`
}
