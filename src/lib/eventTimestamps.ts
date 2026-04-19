import { parseServerTimestamp } from '@/lib/parseServerTimestamp'

/**
 * MySQL TIMESTAMP / datetime strings from the pool often omit a timezone; when the session is UTC,
 * they must be read as UTC instants (not the viewer's local offset) so IST wall times stay correct.
 */
export function eventDbTimestampToMs(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const d = parseServerTimestamp(value)
  if (!d || Number.isNaN(d.getTime())) return null
  return d.getTime()
}
