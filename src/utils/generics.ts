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
