/** IST is UTC+05:30; event times are stored in UTC but shown/edited in IST. */
const IST_OFFSET_MINUTES = 5 * 60 + 30

/**
 * Converts a stored UTC ISO timestamp to the `YYYY-MM-DDTHH:mm` value a native
 * `datetime-local` input expects, expressed in IST wall-clock time. Returns ''
 * for a missing/invalid value.
 */
export function utcIsoToIstLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const ist = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000)
  return ist.toISOString().slice(0, 16)
}

/**
 * Converts a `datetime-local` value (IST wall-clock) back to a UTC ISO string
 * for storage. Returns null for a blank/invalid value.
 */
export function istLocalInputToUtcIso(local: string): string | null {
  if (!local) return null
  const date = new Date(`${local}:00+05:30`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
