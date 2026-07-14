import { createServerFn } from '@tanstack/react-start'

export const getCurrentTime = createServerFn().handler(() => {
  const now = new Date()
  return {
    iso: now.toISOString(),
    formatted: now.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  }
})

export async function getWeeklyRange() {
  const currentTime = await getCurrentTime()

  const today = new Date(currentTime.iso)
  const oneWeekLater = new Date(today)
  oneWeekLater.setDate(today.getDate() + 7)

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const dateRange = `${formatDate(today)} - ${formatDate(oneWeekLater)}`
  return dateRange
}

export const formatTimeInHHMM = (dt: string | null) =>
  dt
    ? `${String(+dt.slice(11, 13) % 12 || 12).padStart(2, '0')}:${dt.slice(14, 16)}${+dt.slice(11, 13) >= 12 ? 'PM' : 'AM'}`
    : '12:00PM'

export const capitalize = (value: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : ''

export function formatSqlDate(sqlDate: string | null): string {
  const date = sqlDate ? new Date(sqlDate) : new Date()

  // If input is null, force time to 12:00 PM
  if (!sqlDate) {
    date.setHours(12, 0, 0, 0)
  }

  const day = date.getDate().toString().padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' })

  const rawHours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = rawHours >= 12 ? 'PM' : 'AM'

  const hours12 = rawHours % 12 || 12
  const hours = hours12.toString().padStart(2, '0')

  return `${day} ${month}, ${hours}:${minutes} ${ampm}`
}
