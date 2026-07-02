/**
 * Banned-user content gating.
 *
 * A user whose account `status` is `banned` should not see content that was
 * created or scheduled *after* the moment they were banned (`status_time`).
 * These two facts — "is this user banned?" and "what is their cutoff?" — are
 * expressed as a single cohesive helper here so callers never re-implement the
 * status/`status_time` parsing themselves.
 */

export const BANNED_STATUS = 'banned'

/** The subset of a user row this module needs. */
export interface BannableUser {
  status: string | null
  /** Timestamp the user was moved to their current status (banned-at time). */
  statusTime: string | Date | null
}

export function isBannedUser(user: BannableUser | null | undefined): boolean {
  return user?.status === BANNED_STATUS
}

/**
 * Resolves the content cutoff for a user:
 * - `null` when the user is not banned or has no valid `status_time`
 *   (meaning: no cutoff, show everything).
 * - a `Date` when the user is banned — content created/started strictly after
 *   this instant must be hidden.
 */
export function getBannedContentCutoff(
  user: BannableUser | null | undefined,
): Date | null {
  if (!isBannedUser(user) || user?.statusTime == null) {
    return null
  }
  const cutoff = new Date(user.statusTime)
  return Number.isNaN(cutoff.getTime()) ? null : cutoff
}

/**
 * True when a piece of content is allowed for a banned user with the given
 * cutoff. A `null` cutoff (not banned / no cutoff) always allows the content.
 * Content is hidden when it was created OR started strictly after the cutoff.
 */
export function isContentWithinBannedCutoff(
  content: { createdAt: string | Date | null; startDate?: string | Date | null },
  cutoff: Date | null,
): boolean {
  if (cutoff === null) return true

  const created = toTime(content.createdAt)
  if (created !== null && created > cutoff.getTime()) return false

  const started = toTime(content.startDate ?? null)
  if (started !== null && started > cutoff.getTime()) return false

  return true
}

function toTime(value: string | Date | null): number | null {
  if (value == null) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}
