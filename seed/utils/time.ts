import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

/** LMS stores naive MySQL datetimes in IST — match `parseMysqlDatetimeIST` in the app. */
export const SEED_TIMEZONE = 'Asia/Kolkata'

export type TimeOffsetInput = {
  daysAgo?: number
  minutesAgo?: number
  minutesFromNow?: number
}

export function offsetFromNow(input: TimeOffsetInput): Date {
  const now = Date.now()
  let ms = now

  if (input.daysAgo != null) {
    ms -= input.daysAgo * 24 * 60 * 60 * 1000
  }
  if (input.minutesAgo != null) {
    ms -= input.minutesAgo * 60 * 1000
  }
  if (input.minutesFromNow != null) {
    ms += input.minutesFromNow * 60 * 1000
  }

  return new Date(ms)
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function formatMysqlDate(date: Date): string {
  return dayjs(date).tz(SEED_TIMEZONE).format('YYYY-MM-DD')
}

export function formatMysqlDatetime(date: Date): string {
  return dayjs(date).tz(SEED_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
}
