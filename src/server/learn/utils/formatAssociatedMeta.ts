import { formatSqlDate } from '@/utils/generics'

// Human-readable secondary line for an associated item — the schedule date, or
// null when the entity has no schedule.
export function formatAssociatedMeta(schedule: string | null): string | null {
  if (schedule == null || schedule.trim() === '') return null
  return formatSqlDate(schedule)
}
