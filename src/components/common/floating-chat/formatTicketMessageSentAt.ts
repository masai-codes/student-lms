/**
 * Formats a ticket message timestamp as `Sent · 9:14 AM` from the DB
 * `created_at` ISO string. Returns null when the value can't be parsed.
 */
export function formatTicketMessageSentAt(
  createdAt: string | null | undefined,
): string | null {
  if (!createdAt) return null
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `Sent · ${time}`
}
