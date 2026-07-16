/**
 * Support module — DB-row → domain-type mappers.
 *
 * Drizzle gives us snake-case-ish rows with nullable columns and loosely-typed
 * JSON. These helpers turn those rows into the clean, UI-friendly shapes in
 * `support.types.ts`. Keeping the mapping here means a column rename only ever
 * touches one place, and every service returns identically-shaped data.
 */

import type {
  SupportPerson,
  TicketStatus,
} from '@/server/api/support/support.types'

/** Status strings we recognise; anything else falls back to `open`. */
const KNOWN_STATUSES: ReadonlyArray<TicketStatus> = [
  'open',
  're-opened',
  'resolved',
  'closed',
  'automatic',
]

/** Normalise a raw `tickets.status` value into a {@link TicketStatus}. */
export function normalizeStatus(raw: string | null | undefined): TicketStatus {
  const value = (raw ?? 'open').toLowerCase()
  return (KNOWN_STATUSES as ReadonlyArray<string>).includes(value)
    ? (value as TicketStatus)
    : 'open'
}

/** A ticket is "resolved-ish" (no longer in the unresolved tab) when closed. */
export function isResolvedStatus(status: TicketStatus): boolean {
  return status === 'resolved' || status === 'closed' || status === 'automatic'
}

/** Shape of the user columns we select for any "person" in the UI. */
export interface UserRowLite {
  id: number
  name: string
  role?: string | null
  profilePhotoPath?: string | null
}

/** Map a user row to a {@link SupportPerson}. */
export function toPerson(row: UserRowLite): SupportPerson {
  return {
    id: row.id,
    name: row.name,
    role: row.role ?? null,
    profilePhotoPath: row.profilePhotoPath ?? null,
  }
}

/**
 * Decide which side of the conversation a message belongs to.
 *
 * The student's own messages render on the right; coordinators/agents on the
 * left. A `null`/system author renders as a centered system note.
 */
export function messageSide(
  authorId: number | null,
  studentUserId: number,
): 'student' | 'agent' | 'system' {
  if (authorId == null) return 'system'
  return authorId === studentUserId ? 'student' : 'agent'
}
