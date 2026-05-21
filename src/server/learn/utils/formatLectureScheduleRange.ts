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

export function formatLectureScheduleRange(
  schedule: string | null,
  concludes: string | null,
): string {
  if (schedule == null || schedule.trim() === '') {
    return ''
  }

  const start = new Date(schedule)
  if (Number.isNaN(start.getTime())) {
    return ''
  }

  if (concludes == null || concludes.trim() === '') {
    return formatPart(start, { ...DATE_FORMAT, ...TIME_FORMAT })
  }

  const end = new Date(concludes)
  if (Number.isNaN(end.getTime())) {
    return formatPart(start, { ...DATE_FORMAT, ...TIME_FORMAT })
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
