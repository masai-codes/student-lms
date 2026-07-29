/** 5h 30m — legacy ticket rows store IST wall-clock in TIMESTAMP columns. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

/**
 * Exceptional support-floater-only adjustment: ticket `created_at` values from
 * the DB are IST wall-clock but arrive in the client as UTC ISO strings, so the
 * clock reads 5h30m ahead. Subtract that offset before rendering "Sent · …".
 *
 * Do NOT reuse this conversion elsewhere — other surfaces should use the shared
 * timezone helpers (`formatSocialPostTime`, `formatTimestampLocal`, etc.).
 */
function adjustFloaterTicketDbTimestamp(date: Date): Date {
  return new Date(date.getTime() - IST_OFFSET_MS)
}

/**
 * Formats a ticket message timestamp as `Sent · 9:14 AM` from the DB
 * `created_at` ISO string. Returns null when the value can't be parsed.
 */
export function formatTicketMessageSentAt(
  createdAt: string | null | undefined,
): string | null {
  if (!createdAt) return null
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return null

  const date = adjustFloaterTicketDbTimestamp(parsed)
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `Sent · ${time}`
}
